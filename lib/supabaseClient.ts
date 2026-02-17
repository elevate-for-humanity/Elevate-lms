/**
 * @deprecated Use '@/lib/supabase/client' instead.
 * This file is kept for backward compatibility.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  _supabase = createClient(supabaseUrl, supabaseKey);
  return _supabase;
}

// Legacy export for backward compatibility
export const supabase = null as unknown as SupabaseClient | null;
