import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import { COMMUNICATION_MEMBER_ROLES } from '@/lib/phone/access';
import { MeetingRoom } from '../MeetingRoom';

export const dynamic = 'force-dynamic';

export default async function MeetingRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const auth = await requireRole(COMMUNICATION_MEMBER_ROLES);
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  const db = await requireAdminClient();
  const { data: room } = await db
    .from('communication_rooms')
    .select('id,title,status,communication_workspaces!inner(tenant_id)')
    .eq('id', roomId)
    .maybeSingle();
  const workspace = Array.isArray((room as any)?.communication_workspaces)
    ? (room as any).communication_workspaces[0]
    : (room as any)?.communication_workspaces;
  const platformAdmin = auth.effectiveRoles.some(
    (role) => role === 'admin' || role === 'super_admin',
  );
  const workspaceTenantId = workspace?.tenant_id ?? null;
  const canAccessWorkspace =
    Boolean(tenantId || platformAdmin) &&
    (workspaceTenantId === tenantId || (platformAdmin && workspaceTenantId === null));
  if (!room || !canAccessWorkspace || room.status === 'cancelled') notFound();

  return (
    <main className="space-y-4 bg-slate-50 p-4 sm:p-6">
      <Link href="/phone/meetings" className="text-sm font-bold text-indigo-700">
        ← Team Meetings
      </Link>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
          Secure Elevate room
        </p>
        <h1 className="text-2xl font-black">{room.title}</h1>
      </div>
      <MeetingRoom roomId={room.id} />
    </main>
  );
}
