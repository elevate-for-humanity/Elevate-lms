/**
 * Safely extract user from Supabase auth response.
 * Prevents "Cannot read properties of null (reading 'id')" crash when data is null.
 */
export function safeGetUser(authRes: any): { id: string; email?: string | null } | null {
  return authRes?.data?.user ?? null;
}
