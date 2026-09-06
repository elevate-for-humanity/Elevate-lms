import { cookies } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyPortalPreviewHandoff } from './portal-preview-handoff';

export const HOST_SHOP_PREVIEW_SESSION_COOKIE = 'elevate_host_shop_preview_session';
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'org_admin']);

export async function resolveHostShopAdminPreview() {
  const cookieStore = await cookies();
  const token = cookieStore.get(HOST_SHOP_PREVIEW_SESSION_COOKIE)?.value || '';
  const handoff = verifyPortalPreviewHandoff(token);
  if (!handoff) return null;

  const db = await requireAdminClient();
  const [{ data: actor }, { data: partner }] = await Promise.all([
    db.from('profiles').select('id,role,email').eq('id', handoff.actorId).maybeSingle(),
    db.from('partners').select('id,status,approval_status,is_active').eq('id', handoff.targetId).maybeSingle(),
  ]);

  if (
    !actor?.id ||
    !ADMIN_ROLES.has(String(actor.role || '')) ||
    !partner?.id ||
    partner.status !== 'active' ||
    partner.approval_status !== 'approved' ||
    partner.is_active === false
  ) return null;

  return {
    actorId: actor.id as string,
    actorEmail: (actor.email as string | null) || '',
    actorRole: String(actor.role || 'admin'),
    partnerId: partner.id as string,
  };
}
