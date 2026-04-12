import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });

  // Verify caller is a partner user
  const { data: partnerUser } = await db
    .from('partner_users')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single();

  if (!partnerUser) return safeError('Forbidden', 403);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const {
    name,
    address,
    city,
    state,
    contact_name,
    contact_email,
    contact_phone,
    notification_preferences,
  } = body;

  const orgId = partnerUser.partner_id;

  try {
    const { error } = await db
      .from('partners')
      .update({
        name,
        address,
        city,
        state,
        contact_name,
        contact_email,
        contact_phone,
        notification_preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) return safeError('Failed to update settings', 500);

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to update partner settings');
  }
}
