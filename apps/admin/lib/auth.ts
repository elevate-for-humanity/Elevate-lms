import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Get authenticated user with role validation.
 * Redirects to login if not authenticated.
 * Redirects to unauthorized if role is invalid.
 */
export async function requireAuth(requiredRoles?: string[]): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const validRoles = requiredRoles || ['admin', 'instructor', 'staff', 'super_admin'];
  
  if (!profile?.role || !validRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return {
    id: user.id,
    email: user.email || '',
    role: profile.role,
  };
}

/**
 * Get authenticated user without role validation.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email || '',
    role: profile?.role || '',
  };
}
