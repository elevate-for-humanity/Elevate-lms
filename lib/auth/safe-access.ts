/**
 * Safe User Access Utilities
 * 
 * Prevents null reference crashes when accessing user properties.
 * Use these helpers instead of direct user.id access.
 * 
 * @example
 * // ❌ UNSAFE - crashes if user is null
 * const id = user.id;
 * 
 * // ✅ SAFE - returns null if user is null
 * const id = getUserId(user);
 * 
 * // ✅ SAFE - throws if user is null (explicit intent)
 * const id = requireUserId(user);
 */

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface SafeUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthResult {
  user: SafeUser | null;
  error: string | null;
}

// =====================================================
// SAFE GETTERS
// =====================================================

/**
 * Safely get user ID - returns null instead of crashing
 */
export function getUserId(user: SafeUser | null): string | null {
  return user?.id ?? null;
}

/**
 * Safely get user email - returns null instead of crashing
 */
export function getUserEmail(user: SafeUser | null): string | null {
  return user?.email ?? null;
}

/**
 * Safely get user role - returns null instead of crashing
 */
export function getUserRole(user: SafeUser | null): string | null {
  return user?.role ?? null;
}

/**
 * Safely get any user property
 */
export function getUserProp<T>(user: SafeUser | null, key: string, fallback: T): T {
  if (!user) return fallback;
  const value = user[key];
  return (value as T) ?? fallback;
}

// =====================================================
// REQUIRE GETTERS (Throw if null)
// =====================================================

/**
 * Require user ID - throws if user is null
 * Use when user must exist (after requireAuth)
 */
export function requireUserId(user: SafeUser | null): string {
  if (!user?.id) {
    throw new Error('User ID is required but user is null');
  }
  return user.id;
}

/**
 * Require user email - throws if user is null
 */
export function requireUserEmail(user: SafeUser | null): string {
  if (!user?.email) {
    throw new Error('User email is required but user is null');
  }
  return user.email;
}

// =====================================================
// CONDITIONAL GETTERS
// =====================================================

/**
 * Execute callback only if user exists
 */
export function withUser<T>(
  user: SafeUser | null,
  callback: (user: SafeUser) => T,
  fallback?: () => T
): T | undefined {
  if (!user) {
    fallback?.();
    return undefined;
  }
  return callback(user);
}

/**
 * Execute callback only if user has required role
 */
export function withRole<T>(
  user: SafeUser | null,
  allowedRoles: string[],
  callback: (user: SafeUser) => T,
  fallback?: () => T
): T | undefined {
  if (!user?.role || !allowedRoles.includes(user.role)) {
    fallback?.();
    return undefined;
  }
  return callback(user);
}

// =====================================================
// VALIDATORS
// =====================================================

/**
 * Check if user exists and has valid ID
 */
export function isValidUser(user: SafeUser | null | undefined): user is SafeUser {
  return !!user?.id;
}

/**
 * Check if user has required role
 */
export function hasRole(user: SafeUser | null, role: string): boolean {
  return !!user?.role && user.role === role;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(user: SafeUser | null, roles: string[]): boolean {
  return !!user?.role && roles.includes(user.role);
}

// =====================================================
// GUARDS
// =====================================================

/**
 * Guard function - returns early if user is null
 * Use in API routes after requireAuth
 */
export function guardUser<T>(
  user: SafeUser | null,
  callback: (userId: string) => T,
  errorMessage = 'User is required'
): { success: true; data: T } | { success: false; error: string } {
  if (!user?.id) {
    return { success: false, error: errorMessage };
  }
  return { success: true, data: callback(user.id) };
}

// =====================================================
// LOGGING HELPERS
// =====================================================

/**
 * Get safe identifier for logging (email or ID)
 */
export function getUserIdentifier(user: SafeUser | null): string {
  if (!user) return 'anonymous';
  return user.email ?? user.id;
}

/**
 * Log with user context (safe)
 */
export function logWithUser(
  user: SafeUser | null,
  message: string,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info'
): void {
  const identifier = getUserIdentifier(user);
  const logMessage = `[${identifier}] ${message}`;
  
  switch (level) {
    case 'debug': console.debug(logMessage); break;
    case 'info': console.info(logMessage); break;
    case 'warn': console.warn(logMessage); break;
    case 'error': console.error(logMessage); break;
  }
}

// =====================================================
// COMMON PATTERNS
// =====================================================

/**
 * Safe Supabase query with user ID
 */
export function withUserId(
  user: SafeUser | null,
  callback: (userId: string) => { eq: (column: string, value: string) => unknown }
): unknown | null {
  if (!user?.id) return null;
  return callback(user.id);
}

/**
 * Safe insert data with user ID
 */
export function withUserIdInsert<T extends Record<string, unknown>>(
  user: SafeUser | null,
  data: T
): T | null {
  if (!user?.id) return null;
  return { ...data, user_id: user.id };
}
