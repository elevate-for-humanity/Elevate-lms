export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Verify admin access
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Check if user is admin
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !['admin', 'super_admin', 'org_admin', 'staff'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Build query
    let query = adminClient
      .from('applications')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        city,
        zip,
        program_interest,
        status,
        advisor_email,
        created_at,
        application_checklist (
          created_icc_account,
          scheduled_workone_appointment,
          workone_appointment_date,
          workone_location,
          attended_workone_appointment,
          funding_verified,
          enrollment_started,
          enrollment_completed
        ),
        employer_sponsors (
          company_name,
          contact_name,
          wage_commitment
        ),
        enrollment_agreements (
          signed,
          signed_at
        )
      `
      )
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Format data for ETPL compliance
    const exportData = data.map((item: any) => ({
      student_id: item.id,
      first_name: item.first_name,
      last_name: item.last_name,
      email: item.email,
      phone: item.phone,
      city: item.city,
      zip: item.zip,
      program: item.program_interest,
      status: item.status,
      advisor: item.advisor_email,
      application_date: item.created_at,
      icc_account_created:
        item.application_checklist?.[0]?.created_icc_account || false,
      workone_scheduled:
        item.application_checklist?.[0]?.scheduled_workone_appointment || false,
      workone_date:
        item.application_checklist?.[0]?.workone_appointment_date || null,
      workone_location:
        item.application_checklist?.[0]?.workone_location || null,
      workone_attended:
        item.application_checklist?.[0]?.attended_workone_appointment || false,
      funding_verified:
        item.application_checklist?.[0]?.funding_verified || false,
      enrollment_started:
        item.application_checklist?.[0]?.enrollment_started || false,
      enrollment_completed:
        item.application_checklist?.[0]?.enrollment_completed || false,
      employer: item.employer_sponsors?.[0]?.company_name || null,
      employer_contact: item.employer_sponsors?.[0]?.contact_name || null,
      wage_commitment: item.employer_sponsors?.[0]?.wage_commitment || null,
      agreement_signed: item.enrollment_agreements?.[0]?.signed || false,
      agreement_date: item.enrollment_agreements?.[0]?.signed_at || null,
    }));

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(','),
        ...exportData.map((item: any) =>
          headers.map((header) => JSON.stringify(item[header] || '')).join(',')
        ),
      ];
      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="etpl-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Return JSON by default
    return NextResponse.json({
      export_date: new Date().toISOString(),
      record_count: exportData.length,
      data: exportData,
    });
  } catch (error) { 
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
