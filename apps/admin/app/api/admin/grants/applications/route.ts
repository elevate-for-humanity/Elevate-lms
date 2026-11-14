import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

const WRITABLE = [
  'opportunity_id','opportunity_title','opportunity_number','agency_name','cfda_number',
  'deadline','award_ceiling','award_floor','opportunity_url','org_id','legal_name','ein',
  'uei','sam_status','org_address','contact_name','contact_email','contact_phone',
  'project_title','executive_summary','problem_statement','project_description',
  'target_population','geographic_area','goals_and_objectives','evaluation_plan',
  'sustainability_plan','budget_narrative','budget_total','partner_agencies',
  'attached_document_ids','notes','status',
];

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const db = await requireAdminClient();

  const payload: Record<string, unknown> = { created_by: auth.id };
  for (const k of WRITABLE) {
    if (k in body && body[k] !== '' && body[k] !== undefined) payload[k] = body[k];
  }

  const { data: application, error } = await db
    .from('grant_applications')
    .insert(payload)
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to create application');
  return NextResponse.json({ application });
}

export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  if (!body.id) return safeError('id required', 400);

  const db = await requireAdminClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of WRITABLE) {
    if (k in body) updates[k] = body[k] || null;
  }
  if (body.status === 'submitted') updates.submitted_at = new Date().toISOString();

  const { data: application, error } = await db
    .from('grant_applications')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to update application');
  return NextResponse.json({ application });
}

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('grant_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return safeDbError(error, 'Failed to fetch applications');
  return NextResponse.json({ applications: data });
}
