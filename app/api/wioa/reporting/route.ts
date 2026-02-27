export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase-api';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// GET /api/wioa/reporting - Generate WIOA reports
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createSupabaseClient();
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!reportType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Report type is required',
          },
        },
        { status: 400 }
      );
    }

    let reportData: any = {};

    switch (reportType) {
      case 'enrollment':
        reportData = await generateEnrollmentReport(
          supabase,
          startDate,
          endDate
        );
        break;
      case 'outcomes':
        reportData = await generateOutcomesReport(supabase, startDate, endDate);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(
          supabase,
          startDate,
          endDate
        );
        break;
      case 'demographics':
        reportData = await generateDemographicsReport(
          supabase,
          startDate,
          endDate
        );
        break;
      case 'services':
        reportData = await generateServicesReport(supabase, startDate, endDate);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_REPORT_TYPE',
              message: 'Invalid report type',
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: reportData });
  } catch (error) { 
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: toErrorMessage(error) },
      },
      { status: 500 }
    );
  }
}

async function generateEnrollmentReport(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  let query = supabase.from('program_enrollments').select('*, profiles(*)');

  if (startDate) query = query.gte('enrollment_date', startDate);
  if (endDate) query = query.lte('enrollment_date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  return {
    totalEnrollments: data?.length || 0,
    enrollments: data,
    reportGenerated: new Date().toISOString(),
  };
}

async function generateOutcomesReport(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  let query = supabase.from('employment_outcomes').select('*');

  if (startDate) query = query.gte('start_date', startDate);
  if (endDate) query = query.lte('start_date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  const employed =
    data?.filter((e) => e.employment_status === 'employed').length || 0;
  const avgWage =
    data?.reduce((sum, e) => sum + (e.hourly_wage || 0), 0) /
    (data?.length || 1);

  return {
    totalPlacements: data?.length || 0,
    employed,
    averageWage: avgWage.toFixed(2),
    outcomes: data,
    reportGenerated: new Date().toISOString(),
  };
}

async function generatePerformanceReport(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  // WIOA Performance Measures
  const enrollments = await generateEnrollmentReport(
    supabase,
    startDate,
    endDate
  );
  const outcomes = await generateOutcomesReport(supabase, startDate, endDate);

  return {
    enrollmentRate: enrollments.totalEnrollments,
    placementRate: outcomes.employed,
    averageWage: outcomes.averageWage,
    reportGenerated: new Date().toISOString(),
  };
}

async function generateDemographicsReport(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  const { data, error }: any = await supabase
    .from('participant_eligibility')
    .select('*');

  if (error) throw error;

  const demographics = {
    totalParticipants: data?.length || 0,
    veterans: data?.filter((p) => p.is_veteran).length || 0,
    dislocatedWorkers: data?.filter((p) => p.is_dislocated_worker).length || 0,
    lowIncome: data?.filter((p) => p.is_low_income).length || 0,
    youth: data?.filter((p) => p.is_youth).length || 0,
    disabilities: data?.filter((p) => p.has_disability).length || 0,
    reportGenerated: new Date().toISOString(),
  };

  return demographics;
}

async function generateServicesReport(
  supabase: any,
  startDate: string | null,
  endDate: string | null
) {
  let query = supabase.from('supportive_services').select('*');

  if (startDate) query = query.gte('request_date', startDate);
  if (endDate) query = query.lte('request_date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  const totalRequested =
    data?.reduce((sum, s) => sum + (s.requested_amount || 0), 0) || 0;
  const totalApproved =
    data
      ?.filter((s) => s.status === 'approved')
      .reduce((sum, s) => sum + (s.approved_amount || 0), 0) || 0;

  return {
    totalRequests: data?.length || 0,
    approved: data?.filter((s) => s.status === 'approved').length || 0,
    denied: data?.filter((s) => s.status === 'denied').length || 0,
    pending: data?.filter((s) => s.status === 'pending').length || 0,
    totalRequested,
    totalApproved,
    services: data,
    reportGenerated: new Date().toISOString(),
  };
}
export const GET = withApiAudit('/api/wioa/reporting', _GET);
