
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * WIOA Quarterly Performance Report API
 * Generates quarterly reports for workforce compliance
 */

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const quarter = parseInt(searchParams.get('quarter') || '1', 10);
    const year = parseInt(
      searchParams.get('year') || new Date().getFullYear().toString(),
      10
    );
    const programId = searchParams.get('programId');
    const format = searchParams.get('format') || 'json'; // json, csv, excel

    // Validate quarter
    if (quarter < 1 || quarter > 4) {
      return NextResponse.json(
        { error: 'Invalid quarter (1-4)' },
        { status: 400 }
      );
    }

    // Calculate date range for quarter
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);

    // Build report data
    const reportData = await generateQuarterlyReport(
      supabase,
      startDate,
      endDate,
      programId
    );

    // Return based on format
    if (format === 'csv') {
      const csv = convertToCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="wioa-q${quarter}-${year}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      quarter,
      year,
      reportPeriod: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      data: reportData,
    });
  } catch (error) { 
    logger.error('WIOA report generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * Generate quarterly performance report
 */
async function generateQuarterlyReport(
  supabase: any,
  startDate: Date,
  endDate: Date,
  programId: string | null
) {
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  // 1. Enrollment Metrics
  let enrollmentQuery = supabase
    .from('program_enrollments')
    .select('id, status, created_at, completed_at, user_id, course_id')
    .gte('created_at', startISO)
    .lte('created_at', endISO);

  if (programId) {
    enrollmentQuery = enrollmentQuery.eq('program_id', programId);
  }

  const { data: enrollments, error: enrollError } = await enrollmentQuery;

  if (enrollError) {
    logger.error('Enrollment query error:', enrollError);
  }

  const totalEnrolled = enrollments?.length || 0;
  const totalCompleted =
    enrollments?.filter((e) => e.status === 'completed').length || 0;
  const totalDropped =
    enrollments?.filter((e) => e.status === 'dropped').length || 0;
  const completionRate =
    totalEnrolled > 0
      ? ((totalCompleted / totalEnrolled) * 100).toFixed(2)
      : '0.00';

  // 2. Employment Outcomes
  const { data: employmentOutcomes } = await supabase
    .from('employment_outcomes')
    .select('*')
    .gte('employment_date', startISO)
    .lte('employment_date', endISO);

  const totalEmployed =
    employmentOutcomes?.filter((e) => e.employed).length || 0;
  const employedInField =
    employmentOutcomes?.filter((e) => e.is_career_pathway).length || 0;
  const retained30Days =
    employmentOutcomes?.filter((e) => e.retained_30_days).length || 0;
  const retained90Days =
    employmentOutcomes?.filter((e) => e.retained_90_days).length || 0;

  // Calculate median wage
  const wages =
    employmentOutcomes
      ?.filter((e) => e.hourly_wage)
      .map((e) => parseFloat(e.hourly_wage))
      .sort((a, b) => a - b) || [];

  const medianWage = wages.length > 0 ? wages[Math.floor(wages.length / 2)] : 0;

  const employmentRate =
    totalCompleted > 0
      ? ((totalEmployed / totalCompleted) * 100).toFixed(2)
      : '0.00';

  const retentionRate90 =
    totalEmployed > 0
      ? ((retained90Days / totalEmployed) * 100).toFixed(2)
      : '0.00';

  // 3. Credentials Earned
  const { data: credentials } = await supabase
    .from('credentials_attained')
    .select('*')
    .gte('issue_date', startISO)
    .lte('issue_date', endISO);

  const credentialsEarned = credentials?.length || 0;
  const credentialRate =
    totalCompleted > 0
      ? ((credentialsEarned / totalCompleted) * 100).toFixed(2)
      : '0.00';

  // 4. Demographics
  const userIds = enrollments?.map((e) => e.user_id) || [];
  const { data: demographics } = await supabase
    .from('participant_demographics')
    .select('*')
    .in('user_id', userIds);

  const participantsFemale =
    demographics?.filter((d) => d.gender === 'female').length || 0;
  const participantsMale =
    demographics?.filter((d) => d.gender === 'male').length || 0;
  const participantsVeteran =
    demographics?.filter((d) => d.is_veteran).length || 0;
  const participantsLowIncome =
    demographics?.filter((d) => d.is_low_income).length || 0;
  const participantsDisability =
    demographics?.filter((d) => d.has_disability).length || 0;

  // 5. Program Breakdown (if no specific program)
  let programBreakdown = null;
  if (!programId) {
    const { data: programs } = await supabase
      .from('programs')
      .select('id, title');

    programBreakdown = await Promise.all(
      (programs || []).map(async (program: Record<string, any>) => {
        const { data: programEnrollments } = await supabase
          .from('program_enrollments')
          .select('id, status')
          .eq('program_id', program.id)
          .gte('created_at', startISO)
          .lte('created_at', endISO);

        return {
          programId: program.id,
          programName: program.title,
          enrolled: programEnrollments?.length || 0,
          completed:
            programEnrollments?.filter(
              (e: Record<string, any>) => e.status === 'completed'
            ).length || 0,
        };
      })
    );
  }

  return {
    summary: {
      totalEnrolled,
      totalCompleted,
      totalDropped,
      completionRate: parseFloat(completionRate),
      totalEmployed,
      employedInField,
      employmentRate: parseFloat(employmentRate),
      medianWage,
      credentialsEarned,
      credentialRate: parseFloat(credentialRate),
      retained30Days,
      retained90Days,
      retentionRate90: parseFloat(retentionRate90),
    },
    demographics: {
      female: participantsFemale,
      male: participantsMale,
      veteran: participantsVeteran,
      lowIncome: participantsLowIncome,
      disability: participantsDisability,
    },
    programBreakdown,
  };
}

/**
 * Convert report data to CSV format
 */
function convertToCSV(reportData: Record<string, any>): string {
  const { summary, demographics } = reportData;

  let csv = 'WIOA Quarterly Performance Report\n\n';

  csv += 'Metric,Value\n';
  csv += `Total Enrolled,${summary.totalEnrolled}\n`;
  csv += `Total Completed,${summary.totalCompleted}\n`;
  csv += `Total Dropped,${summary.totalDropped}\n`;
  csv += `Completion Rate,${summary.completionRate}%\n`;
  csv += `Total Employed,${summary.totalEmployed}\n`;
  csv += `Employed in Field,${summary.employedInField}\n`;
  csv += `Employment Rate,${summary.employmentRate}%\n`;
  csv += `Median Wage,$${summary.medianWage}\n`;
  csv += `Credentials Earned,${summary.credentialsEarned}\n`;
  csv += `Credential Rate,${summary.credentialRate}%\n`;
  csv += `Retained 30 Days,${summary.retained30Days}\n`;
  csv += `Retained 90 Days,${summary.retained90Days}\n`;
  csv += `Retention Rate (90 days),${summary.retentionRate90}%\n`;

  csv += '\nDemographics\n';
  csv += `Female,${demographics.female}\n`;
  csv += `Male,${demographics.male}\n`;
  csv += `Veterans,${demographics.veteran}\n`;
  csv += `Low Income,${demographics.lowIncome}\n`;
  csv += `Disability,${demographics.disability}\n`;

  return csv;
}

/**
 * POST endpoint to save quarterly report
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { quarter, year, programId, reportData } = body;

    // Save to quarterly_performance table
    const { data, error }: any = await supabase
      .from('quarterly_performance')
      .upsert({
        quarter,
        year,
        program_id: programId,
        ...reportData.summary,
        participants_female: reportData.demographics.female,
        participants_male: reportData.demographics.male,
        participants_veteran: reportData.demographics.veteran,
        participants_low_income: reportData.demographics.lowIncome,
        participants_disability: reportData.demographics.disability,
        generated_by: user.id,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving report:', error);
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report saved successfully',
      data,
    });
  } catch (error) { 
    logger.error('Error saving report:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/analytics/reports/wioa-quarterly', _GET);
export const POST = withApiAudit('/api/analytics/reports/wioa-quarterly', _POST);
