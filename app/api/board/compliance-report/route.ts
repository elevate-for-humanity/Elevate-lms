import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateComplianceReportPDF } from '@/lib/pdf/generator';
import { safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    // Get all programs
    const { data: programs } = await supabase.from('programs').select('*');

    // Get enrollment stats
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*')
      .gte('created_at', startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', endDate || new Date().toISOString());

    const totalStudents = enrollments?.length || 0;
    const activeStudents = enrollments?.filter((e) => e.status === 'active').length || 0;
    const completedStudents = enrollments?.filter((e) => e.status === 'completed').length || 0;
    const complianceRate =
      totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

    const doc = generateComplianceReportPDF({
      reportDate: new Date().toLocaleDateString(),
      reportingPeriod: `${new Date(startDate || Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date(endDate || Date.now()).toLocaleDateString()}`,
      programName: 'All Programs - Board Report',
      totalStudents,
      activeStudents,
      completedStudents,
      complianceRate,
      details: [
        { metric: 'Total Programs', value: `${programs?.length || 0}`, status: 'Good' },
        { metric: 'Enrollment Rate', value: `${totalStudents}`, status: 'Good' },
        {
          metric: 'Completion Rate',
          value: `${complianceRate}%`,
          status: complianceRate >= 70 ? 'Good' : 'Needs Improvement',
        },
        { metric: 'Active Students', value: `${activeStudents}`, status: 'Good' },
        {
          metric: 'Retention Rate',
          value: `${Math.round((activeStudents / (totalStudents || 1)) * 100)}%`,
          status: 'Good',
        },
      ],
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="board-compliance-report-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to generate report');
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
