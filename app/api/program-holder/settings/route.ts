import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['program_holder', 'admin', 'super_admin', 'staff'];

export async function PATCH(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return safeError('Forbidden', 403);

  let body: {
    organization?: string;
    email?: string;
    notify_enrollments?: boolean;
    notify_weekly_reports?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.organization === 'string') profileUpdates.organization = body.organization.trim();
  if (typeof body.email === 'string') profileUpdates.email = body.email.trim();

  const { error: profileError } = await db
    .from('profiles')
    .update(profileUpdates)
    .eq('id', user.id);

  if (profileError) return safeInternalError(profileError, 'Failed to save profile');

  // Notification preferences — upsert into program_holder_notification_preferences if it exists,
  // otherwise store on the program_holders row
  if (
    typeof body.notify_enrollments === 'boolean' ||
    typeof body.notify_weekly_reports === 'boolean'
  ) {
    let holderId: string | null = profile.program_holder_id ?? null;
    if (!holderId) {
      const { data: fallbackHolder } = await db
        .from('program_holders')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      holderId = fallbackHolder?.id ?? null;
    }

    if (holderId) {
      const notifUpdates: Record<string, unknown> = {};
      if (typeof body.notify_enrollments === 'boolean')
        notifUpdates.notify_enrollments = body.notify_enrollments;
      if (typeof body.notify_weekly_reports === 'boolean')
        notifUpdates.notify_weekly_reports = body.notify_weekly_reports;

      await db.from('program_holders').update(notifUpdates).eq('id', holderId);
    }
  }

  return NextResponse.json({ success: true });
}
