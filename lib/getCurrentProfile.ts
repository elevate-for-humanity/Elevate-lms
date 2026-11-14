// lib/getCurrentProfile.ts
// NOTE: getCurrentProfile has no active callers in app/ as of 2026-Q2.
// Kept for potential future use. Uses canonical @/lib/supabase/server client.
import { createClient } from '@/lib/supabase/server';

export type UserRole =
  | 'student'
  | 'program_holder'
  | 'instructor'
  | 'admin'
  | 'grant_client';

export type CurrentProfile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  program_holder_id: string | null;
} | null;

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile) return null;

  return profile as CurrentProfile;
}
