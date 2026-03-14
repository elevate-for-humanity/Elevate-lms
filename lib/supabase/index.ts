/**
 * Supabase Client - Unified Export
 * 
 * Use the appropriate client for your context:
 * - Server Components/API Routes: createClient() or createAdminClient()
 * - Client Components: Use createBrowserClient from './client'
 */

export { createClient } from './server';
export { createAdminClient } from './admin';
export { createBrowserClient } from './client';

// Re-export types
export type { SupabaseClient } from '@supabase/supabase-js';
