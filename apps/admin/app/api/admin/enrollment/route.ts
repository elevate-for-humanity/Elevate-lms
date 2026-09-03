/**
 * Admin Enrollment V2 API
 * Server-only endpoint using service-role key.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';
import type { AuthHandler } from '@/types/auth';

export const dynamic = 'force-dynamic';

const handleGet: AuthHandler = async (req: NextRequest) => {
  const supabase = await requireAdminClient();
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const programSlug = url.searchParams.get('program');
  const fundingSource = url.searchParams.get('funding');
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('enrollment_v2_applications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('enrollment_status', status);
  if (programSlug) query = query.eq('program_slug', programSlug);
  if (fundingSource) query = query.eq('funding_source', fundingSource);

  const { data: applications, error, count } = await query;
  if (error) {
    console.error('Admin enrollment v2 error:', error);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }

  return NextResponse.json({ applications: applications || [], total: count || 0 });
};

const handlePatch: AuthHandler = async (req: NextRequest) => {
  const supabase = await requireAdminClient();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('enrollment_v2_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Admin enrollment update error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }

  return NextResponse.json({ success: true, application: data });
};

const handlePost: AuthHandler = async (req: NextRequest) => {
  const supabase = await requireAdminClient();
  const body = await req.json();
  const { action, applicationId, notes } = body;

  if (!applicationId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  switch (action) {
    case 'approve':
      updates.enrollment_status = 'approved';
      updates.agreement_status = 'sent';
      updates.agreement_sent_at = new Date().toISOString();
      break;
    case 'enroll':
      updates.enrollment_status = 'enrolled';
      updates.enrolled_at = new Date().toISOString();
      break;
    case 'reject':
      updates.enrollment_status = 'rejected';
      break;
    case 'withdraw':
      updates.enrollment_status = 'withdrawn';
      break;
    case 'reject_binder':
      updates.binder_status = 'rejected';
      break;
    case 'approve_binder':
      updates.binder_status = 'approved';
      updates.binder_reviewed_at = new Date().toISOString();
      break;
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  if (notes) updates.admin_notes = notes;

  const { data, error } = await supabase
    .from('enrollment_v2_applications')
    .update(updates)
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    console.error('Enrollment action error:', error);
    return NextResponse.json({ error: `Failed to ${action} application` }, { status: 500 });
  }

  return NextResponse.json({ success: true, application: data, action });
};

export const GET = withAuth(handleGet, { roles: API_ADMIN_ROLES });
export const PATCH = withAuth(handlePatch, { roles: API_ADMIN_ROLES });
export const POST = withAuth(handlePost, { roles: API_ADMIN_ROLES });
