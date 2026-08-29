import { cookies } from 'next/headers';
import type { SupabaseClient } from '@/lib/supabase';

export const PORTAL_PREVIEW_COOKIE = 'elevate_portal_preview_user';
const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export async function resolvePortalPreviewSubject(
  db: SupabaseClient,
  authenticatedUserId: string,
): Promise<{ userId: string; previewing: boolean }> {
  const { data: actor } = await db.from('profiles').select('role').eq('id', authenticatedUserId).maybeSingle();
  if (!ADMIN_ROLES.has(String(actor?.role || ''))) {
    return { userId: authenticatedUserId, previewing: false };
  }

  const targetUserId = (await cookies()).get(PORTAL_PREVIEW_COOKIE)?.value?.trim();
  if (!targetUserId || targetUserId === authenticatedUserId) {
    return { userId: authenticatedUserId, previewing: false };
  }

  const { data: target } = await db.from('profiles').select('id,role').eq('id', targetUserId).maybeSingle();
  if (!target?.id || ADMIN_ROLES.has(String(target.role || ''))) {
    return { userId: authenticatedUserId, previewing: false };
  }

  return { userId: target.id, previewing: true };
}
