/** @deprecated Use '@/lib/supabase/admin' instead. */
// =====================================================
// SUPABASE ADMIN CLIENT
// =====================================================
// This client uses the service role key and has elevated
// permissions to access auth.users and other protected tables.
// Only use this in server-side API routes, never expose to client.

import { createClient } from '@supabase/supabase-js';

// Lazy initialization - only create client when actually used, not at module load time
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  // Never throw — missing env vars return a no-op client so the lambda doesn't crash on cold start

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabaseAdmin;
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>];
  },
});

// Helper function to get user by email.
// Queries profiles table directly — O(1) indexed lookup, not a full auth.admin.listUsers() scan.
export async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email')
    .ilike('email', email.trim())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Return the auth user record so callers get the same shape as before
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(data.id);
  if (authError) throw authError;
  return authData.user ?? null;
}

// Helper function to get user by ID
export async function getUserById(userId: string) {
  const { data, error }: any = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    throw error;
  }

  return data.user;
}
