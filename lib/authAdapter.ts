/**
 * @deprecated This module is unused. Use '@/lib/auth' and '@/lib/authGuards' instead.
 */
export type AuthProviderType = 'supabase' | 'oidc' | 'azure-ad' | 'custom-jwt';
export type AuthUser = {
  id: string;
  email: string;
  role: string;
  name?: string;
};
export type AuthAdapter = {
  getUser: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
};
export function getAuthAdapter(): AuthAdapter {
  throw new Error('authAdapter is deprecated. Use @/lib/auth instead.');
}
