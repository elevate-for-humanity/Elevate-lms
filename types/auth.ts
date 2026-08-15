// types/auth.ts
// UserRole canonical source is lib/rbac/role-matrix.ts.
// Re-exported here so existing imports continue to work without changes.
import { NextRequest } from 'next/server';
import type { UserRole } from '@/lib/rbac/role-matrix';

export type { UserRole } from '@/lib/rbac/role-matrix';

export interface AuthedUser {
  id: string;
  email: string | null;
  role: UserRole | null;
  effectiveRoles: UserRole[];
}

export interface RouteContext<TParams = Record<string, string>> {
  params: TParams;
}

export interface AuthedContext<TParams = Record<string, string>> extends RouteContext<TParams> {
  user: AuthedUser;
  /** Compatibility aliases for handlers migrated from the older flat context. */
  id: string;
  email: string | null;
  role: UserRole | null;
  effectiveRoles: UserRole[];
}

/**
 * Canonical authenticated route handler contract.
 *
 * `user` is available both on context.user and as a third argument. The flat
 * identity aliases preserve compatibility with older handlers while every
 * invocation still goes through the same Supabase/RBAC guard.
 */
export type AuthHandler<TParams = Record<string, string>> = (
  req: NextRequest,
  context: AuthedContext<TParams>,
  user: AuthedUser,
) => Promise<Response> | Response;

export interface WithAuthOptions {
  roles?: UserRole[];
}
