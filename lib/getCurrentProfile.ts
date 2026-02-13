
// lib/getCurrentProfile.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type UserRole =
  | 'student'
  | 'program_holder'
  | 'instructor'
  | 'admin'
  | 'vita_staff'
  | 'supersonic_staff'
  | 'grant_client';

export type CurrentProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  program_holder_id: string | null;
} | null;

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Content-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, program_holder_id')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // Error: $1
    return null;
  }

  return profile as CurrentProfile;
}
