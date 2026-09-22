import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createMeetingToken } from '@/lib/communications/livekit';

export const runtime = 'nodejs';

export async function POST(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,tenant_id,organization_id,role,first_name,last_name,full_name,email')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 403 });

  const db = await requireAdminClient();
  const { data: room } = await db
    .from('communication_rooms')
    .select(
      'id,room_key,status,allow_screen_share,communication_workspaces!inner(tenant_id,status)',
    )
    .eq('id', roomId)
    .maybeSingle();
  const workspace: any = Array.isArray((room as any)?.communication_workspaces)
    ? (room as any).communication_workspaces[0]
    : (room as any)?.communication_workspaces;
  const tenantId = profile.tenant_id ?? profile.organization_id ?? null;
  const platformAdmin = ['admin', 'super_admin'].includes(String(profile.role || '').toLowerCase());
  const workspaceTenantId = workspace?.tenant_id ?? null;
  const canAccessWorkspace =
    Boolean(tenantId || platformAdmin) &&
    (workspaceTenantId === tenantId || (platformAdmin && workspaceTenantId === null));
  if (
    !room ||
    !canAccessWorkspace ||
    workspace?.status !== 'active' ||
    room.status === 'cancelled'
  ) {
    return NextResponse.json({ error: 'Meeting is unavailable.' }, { status: 403 });
  }
  const name =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email ||
    'Team member';
  try {
    return NextResponse.json(
      await createMeetingToken({
        roomName: room.room_key,
        identity: profile.id,
        displayName: name,
        canPublish: true,
        canShare: room.allow_screen_share,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Meeting service unavailable.' },
      { status: 503 },
    );
  }
}
