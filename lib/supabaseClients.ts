/** @deprecated Use '@/lib/supabase/server', '@/lib/supabase/client', '@/lib/supabase/admin' instead. */
// lib/supabaseClients.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization to avoid build-time errors
let clientSupabase: SupabaseClient | null = null;
let serverSupabase: SupabaseClient | null = null;
let adminSupabase: SupabaseClient | null = null;

function getEnvVars() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

// For client-side components (React hooks, etc.)
export function getClientSupabase() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!clientSupabase) {
    clientSupabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientSupabase;
}

// For server components (App Router async page components)
export function getServerSupabase() {
  const { supabaseUrl, supabaseAnonKey } = getEnvVars();
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!serverSupabase) {
    serverSupabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return serverSupabase;
}

// For admin / backend API routes only (service role key)
export function getAdminSupabase() {
  const { supabaseUrl, serviceRoleKey } = getEnvVars();
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  if (!adminSupabase) {
    adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return adminSupabase;
}

// Legacy export for backward compatibility
export const supabaseAdmin = null; // Use getAdminSupabase() instead
