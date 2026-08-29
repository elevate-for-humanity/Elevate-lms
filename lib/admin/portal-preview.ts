import { cookies } from 'next/headers';
import type { SupabaseClient } from '@/lib/supabase';
import { verifyPortalPreviewHandoff } from './portal-preview-handoff';

export const PORTAL_PREVIEW_COOKIE = 'elevate_portal_preview_user';
export const PORTAL_PREVIEW_ACTOR_COOKIE = 'elevate_portal_preview_actor';
export const PORTAL_PREVIEW_SESSION_COOKIE = 'elevate_portal_preview_session';
const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export async function resolvePortalPreviewSubject(
  db: SupabaseClient,
  authenticatedUserId?: string | null,
): Promise<{ userId: string; previewing: boolean }> {
  const cookieStore = await cookies();
  const previewSession = verifyPortalPreviewHandoff(cookieStore.get(PORTAL_PREVIEW_SESSION_COOKIE)?.value || '');
  if (previewSession) {
    const [{ data: actor }, { data: target }] = await Promise.all([
      db.from('profiles').select('id,role').eq('id', previewSession.actorId).maybeSingle(),
      db.from('profiles').select('id,role').eq('id', previewSession.targetId).maybeSingle(),
    ]);
    if (actor?.id && ADMIN_ROLES.has(String(actor.role || '')) && target?.id && !ADMIN_ROLES.has(String(target.role || ''))) {
      return { userId: target.id, previewing: true };
    }
  }
  const previewActorId = cookieStore.get(PORTAL_PREVIEW_ACTOR_COOKIE)?.value?.trim();
  const targetUserId = cookieStore.get(PORTAL_PREVIEW_COOKIE)?.value?.trim();
  if (previewActorId && targetUserId) {
    const [{ data: actor }, { data: target }] = await Promise.all([
      db.from('profiles').select('id,role').eq('id', previewActorId).maybeSingle(),
      db.from('profiles').select('id,role').eq('id', targetUserId).maybeSingle(),
    ]);
    if (actor?.id && ADMIN_ROLES.has(String(actor.role || '')) && target?.id && !ADMIN_ROLES.has(String(target.role || ''))) {
      return { userId: target.id, previewing: true };
    }
  }
  if (!authenticatedUserId) return { userId: '', previewing: false };
  const { data: actor } = await db.from('profiles').select('role').eq('id', authenticatedUserId).maybeSingle();
  if (!ADMIN_ROLES.has(String(actor?.role || ''))) {
    return { userId: authenticatedUserId, previewing: false };
  }

  if (!targetUserId || targetUserId === authenticatedUserId) {
    return { userId: authenticatedUserId, previewing: false };
  }

  const { data: target } = await db.from('profiles').select('id,role').eq('id', targetUserId).maybeSingle();
  if (!target?.id || ADMIN_ROLES.has(String(target.role || ''))) {
    return { userId: authenticatedUserId, previewing: false };
  }

  return { userId: target.id, previewing: true };
}
