/**
 * @deprecated Use '@/lib/auth' for session/user functions and '@/lib/authGuards' for guards.
 * This file is kept only for backward compatibility.
 */
export { getCurrentUser, type AuthUser } from '@/lib/auth';
export { requireAuth } from '@/lib/admin/guards';
