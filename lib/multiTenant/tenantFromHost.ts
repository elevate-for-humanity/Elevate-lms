// lib/multiTenant/tenantFromHost.ts
// NOTE: This file is used in root layout which may run in edge context.
// DO NOT import @supabase/supabase-js here - it breaks Netlify edge functions.
// Tenant lookup is disabled to prevent edge runtime crashes.

export async function getTenantFromHost(host?: string) {
  // Tenant lookup disabled - would require Supabase which breaks edge runtime
  // For multi-tenant support, implement via API route called from client component
  return null;
}
