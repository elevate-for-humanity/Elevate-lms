/**
 * @deprecated Use '@/lib/auth' for session/user functions and '@/lib/authGuards' for guards.
 * This file re-exports for backward compatibility.
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.warn('Unauthorized access attempt');
    redirect('/login');
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session || { user, access_token: '', refresh_token: '', expires_in: 0, token_type: 'bearer' as const } as any;
}

export async function getAuthSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export { getCurrentUser } from '@/lib/auth';

export async function requireAuthAPI() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session || { user, access_token: '', refresh_token: '', expires_in: 0, token_type: 'bearer' as const } as any;
}
