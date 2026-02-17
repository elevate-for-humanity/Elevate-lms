import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Compliance Export API
 * 
 * Provides audit-ready exports of:
 * - Agreement acceptances
 * - Handbook acknowledgments
 * - Onboarding progress
 * - Compliance audit logs
 * 
 * Access restricted to admin and super_admin roles.
 */

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const exportType = searchParams.get('type') || 'all';
  const format = searchParams.get('format') || 'json';
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const userId = searchParams.get('user_id');
  const tenantId = searchParams.get('tenant_id');

  try {
    const exportData: Record<string, any> = {
      exported_at: new Date().toISOString(),
      exported_by: user.email,
      parameters: { exportType, startDate, endDate, userId, tenantId },
    };

    // Build date filter
    const dateFilter = (query: any, dateColumn: string) => {
      if (startDate) {
        query = query.gte(dateColumn, startDate);
      }
      if (endDate) {
        query = query.lte(dateColumn, endDate);
      }
      return query;
    };

    // Export agreement acceptances
    if (exportType === 'all' || exportType === 'agreements') {
      let query = supabase
        .from('license_agreement_acceptances')
        .select(`
          id,
          user_id,
          agreement_type,
          document_version,
          signer_name,
          signer_email,
          auth_email,
          signature_method,
          accepted_at,
          ip_address,
          user_agent,
          acceptance_context,
          legal_acknowledgment
        `)
        .order('accepted_at', { ascending: false });

      query = dateFilter(query, 'accepted_at');
      if (userId) query = query.eq('user_id', userId);
      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: agreements, error } = await query;
      if (error) throw error;

      exportData.agreement_acceptances = {
        count: agreements?.length || 0,
        records: agreements || [],
      };
    }

    // Export handbook acknowledgments
    if (exportType === 'all' || exportType === 'handbook') {
      let query = supabase
        .from('handbook_acknowledgments')
        .select(`
          id,
          user_id,
          handbook_version,
          acknowledged_at,
          ip_address,
          user_agent,
          attendance_policy_ack,
          dress_code_ack,
          conduct_policy_ack,
          safety_policy_ack,
          grievance_policy_ack,
          full_acknowledgment
        `)
        .order('acknowledged_at', { ascending: false });

      query = dateFilter(query, 'acknowledged_at');
      if (userId) query = query.eq('user_id', userId);
      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: handbooks, error } = await query;
      if (error) throw error;

      exportData.handbook_acknowledgments = {
        count: handbooks?.length || 0,
        records: handbooks || [],
      };
    }

    // Export onboarding progress
    if (exportType === 'all' || exportType === 'onboarding') {
      let query = supabase
        .from('onboarding_progress')
        .select(`
          id,
          user_id,
          profile_completed,
          profile_completed_at,
          agreements_completed,
          agreements_completed_at,
          handbook_acknowledged,
          handbook_acknowledged_at,
          documents_uploaded,
          documents_uploaded_at,
          status,
          completed_at,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('user_id', userId);
      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: onboarding, error } = await query;
      if (error) throw error;

      exportData.onboarding_progress = {
        count: onboarding?.length || 0,
        records: onboarding || [],
      };
    }

    // Export audit logs
    if (exportType === 'all' || exportType === 'audit') {
      let query = supabase
        .from('compliance_audit_log')
        .select(`
          id,
          event_type,
          event_timestamp,
          user_id,
          user_email,
          user_role,
          target_table,
          target_id,
          details,
          ip_address,
          user_agent,
          request_path
        `)
        .order('event_timestamp', { ascending: false })
        .limit(1000); // Limit audit logs to prevent huge exports

      query = dateFilter(query, 'event_timestamp');
      if (userId) query = query.eq('user_id', userId);
      if (tenantId) query = query.eq('tenant_id', tenantId);

      const { data: auditLogs, error } = await query;
      if (error) throw error;

      exportData.audit_logs = {
        count: auditLogs?.length || 0,
        records: auditLogs || [],
      };
    }

    // Export summary statistics
    if (exportType === 'all' || exportType === 'summary') {
      // Get counts
      const [
        { count: totalAgreements },
        { count: totalHandbooks },
        { count: completedOnboarding },
        { count: pendingOnboarding },
      ] = await Promise.all([
        supabase.from('license_agreement_acceptances').select('*', { count: 'exact', head: true }),
        supabase.from('handbook_acknowledgments').select('*', { count: 'exact', head: true }),
        supabase.from('onboarding_progress').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('onboarding_progress').select('*', { count: 'exact', head: true }).neq('status', 'completed'),
      ]);

      exportData.summary = {
        total_agreement_acceptances: totalAgreements || 0,
        total_handbook_acknowledgments: totalHandbooks || 0,
        completed_onboarding: completedOnboarding || 0,
        pending_onboarding: pendingOnboarding || 0,
      };
    }

    // Format response
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="compliance-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Compliance export error:', error);
    return NextResponse.json(
      { error: 'Failed to export compliance data' },
      { status: 500 }
    );
  }
}

/**
 * Convert export data to CSV format
 */
function convertToCSV(data: Record<string, any>): string {
  const lines: string[] = [];

  // Add header
  lines.push(`Compliance Export Report`);
  lines.push(`Exported: ${data.exported_at}`);
  lines.push(`Exported By: ${data.exported_by}`);
  lines.push('');

  // Add summary if present
  if (data.summary) {
    lines.push('=== SUMMARY ===');
    lines.push(`Total Agreement Acceptances,${data.summary.total_agreement_acceptances}`);
    lines.push(`Total Handbook Acknowledgments,${data.summary.total_handbook_acknowledgments}`);
    lines.push(`Completed Onboarding,${data.summary.completed_onboarding}`);
    lines.push(`Pending Onboarding,${data.summary.pending_onboarding}`);
    lines.push('');
  }

  // Add agreement acceptances
  if (data.agreement_acceptances?.records?.length > 0) {
    lines.push('=== AGREEMENT ACCEPTANCES ===');
    const headers = Object.keys(data.agreement_acceptances.records[0]);
    lines.push(headers.join(','));
    for (const record of data.agreement_acceptances.records) {
      lines.push(headers.map(h => escapeCSV(record[h])).join(','));
    }
    lines.push('');
  }

  // Add handbook acknowledgments
  if (data.handbook_acknowledgments?.records?.length > 0) {
    lines.push('=== HANDBOOK ACKNOWLEDGMENTS ===');
    const headers = Object.keys(data.handbook_acknowledgments.records[0]);
    lines.push(headers.join(','));
    for (const record of data.handbook_acknowledgments.records) {
      lines.push(headers.map(h => escapeCSV(record[h])).join(','));
    }
    lines.push('');
  }

  // Add onboarding progress
  if (data.onboarding_progress?.records?.length > 0) {
    lines.push('=== ONBOARDING PROGRESS ===');
    const headers = Object.keys(data.onboarding_progress.records[0]);
    lines.push(headers.join(','));
    for (const record of data.onboarding_progress.records) {
      lines.push(headers.map(h => escapeCSV(record[h])).join(','));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * POST endpoint for generating compliance reports
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { report_type, user_ids, date_range } = body;

    // Generate specific compliance report
    if (report_type === 'user_compliance') {
      // Get compliance status for specific users
      const results = [];

      for (const userId of user_ids || []) {
        const [
          { data: agreements },
          { data: handbook },
          { data: onboarding },
        ] = await Promise.all([
          supabase
            .from('license_agreement_acceptances')
            .select('agreement_type, accepted_at')
            .eq('user_id', userId),
          supabase
            .from('handbook_acknowledgments')
            .select('acknowledged_at')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('onboarding_progress')
            .select('*')
            .eq('user_id', userId)
            .single(),
        ]);

        results.push({
          user_id: userId,
          agreements_signed: agreements?.map(a => a.agreement_type) || [],
          handbook_acknowledged: !!handbook,
          onboarding_status: onboarding?.status || 'not_started',
          is_compliant: 
            (agreements?.length || 0) >= 3 && 
            !!handbook && 
            onboarding?.status === 'completed',
        });
      }

      return NextResponse.json({
        report_type: 'user_compliance',
        generated_at: new Date().toISOString(),
        generated_by: user.email,
        results,
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Compliance report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
