/**
 * Supabase Client - Unified Export
 * 
 * Use the appropriate client for your context:
 * - Server Components/API Routes: createClient() or createAdminClient()
 * - Client Components: Use createBrowserClient from './client'
 */

export { createClient, createAdminClient } from './server';
export { createBrowserClient } from './client';

// Re-export types
export type { SupabaseClient } from '@supabase/supabase-js';
