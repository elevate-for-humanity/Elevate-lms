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

  // Only throw error in production, allow build to continue in development
  if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) && process.env.NODE_ENV === 'production') {
    throw new Error('Missing Supabase environment variables for admin client');
  }

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

// Helper function to get user by email
export async function getUserByEmail(email: string) {
  // Note: For production, create a database RPC function for efficient email lookup
  // Current implementation fetches all users - optimize for large user bases
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    throw listError;
  }

  const user = listData.users.find((u: any) => u.email === email);
  return user || null;
}

// Helper function to get user by ID
export async function getUserById(userId: string) {
  const { data, error }: any = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    throw error;
  }

  return data.user;
}
