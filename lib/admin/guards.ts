/**
 * Admin Route Guards - Netlify Context Aware
 * Controls access to dev/test tools and sensitive admin features
 * 
 * Required Netlify env vars:
 * - Production: ENABLE_ADMIN_DEVTOOLS=false
 * - Deploy Previews: ENABLE_ADMIN_DEVTOOLS=true (optional)
 */

import { notFound } from 'next/navigation';

export type AdminRole = 'admin' | 'super_admin' | 'staff';

/**
 * Netlify context detection
 * CONTEXT values: "production" | "deploy-preview" | "branch-deploy" | "dev"
 */
const isNetlify = process.env.NETLIFY === 'true';
const netlifyContext = process.env.CONTEXT; // Netlify deploy context

/**
 * Environment detection - Netlify-aware
 */
export const isProd = isNetlify 
  ? netlifyContext === 'production' 
  : process.env.NODE_ENV === 'production';

export const isPreview = isNetlify 
  ? netlifyContext === 'deploy-preview' || netlifyContext === 'branch-deploy'
  : false;

export const isDev = !isProd && !isPreview;

/**
 * Dev tools access control
 * Server-side gating is what matters - keep NEXT_PUBLIC version false
 */
export const allowDevTools = process.env.ENABLE_ADMIN_DEVTOOLS === 'true';

/**
 * Check if user has super_admin role
 */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === 'super_admin';
}

/**
 * Guard for dev/test routes - STRICT
 * 
 * Rules:
 * 1. Production context → ALWAYS 404 (no exceptions)
 * 2. Non-production + ENABLE_ADMIN_DEVTOOLS=false → 404
 * 3. Non-production + ENABLE_ADMIN_DEVTOOLS=true → super_admin only
 * 
 * Usage in layout.tsx:
 *   const { role } = await requireAdmin();
 *   requireDevToolsAccess(role);
 */
export function requireDevToolsAccess(role: string | null | undefined): void {
  // Production = hard block for everyone, no exceptions
  if (isProd) {
    notFound();
  }

  // Non-production but dev tools disabled
  if (!allowDevTools) {
    notFound();
  }

  // Dev tools enabled but not super_admin
  if (!isSuperAdmin(role)) {
    notFound();
  }
}

/**
 * Guard for sensitive admin features (AI, automation, bulk operations)
 * Less restrictive than dev tools but still requires elevated access in prod
 */
export function requireSensitiveFeatureAccess(role: string | null | undefined): void {
  if (isProd && !isSuperAdmin(role)) {
    notFound();
  }
  
  if (!['admin', 'super_admin'].includes(role || '')) {
    notFound();
  }
}

/**
 * Get environment label for UI badge
 */
export function getEnvironmentLabel(): { label: string; color: string } {
  if (isProd) {
    return { label: 'PRODUCTION', color: 'bg-red-100 text-red-800 border-red-200' };
  }
  if (isPreview) {
    return { label: 'PREVIEW', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  }
  return { label: 'DEVELOPMENT', color: 'bg-blue-100 text-blue-800 border-blue-200' };
}

/**
 * Check if dev tools should be visible in navigation
 */
export function shouldShowDevToolsInNav(role: string | null | undefined): boolean {
  // Never show in production
  if (isProd) {
    return false;
  }
  
  // Non-prod: require both flag and super_admin
  return allowDevTools && isSuperAdmin(role);
}

/**
 * List of dev/test route prefixes that should be guarded
 */
export const DEV_TOOL_ROUTES = [
  '/admin/dev-studio',
  '/admin/test-emails',
  '/admin/test-funding',
  '/admin/test-payments',
  '/admin/test-webhook',
  '/admin/ai-console',
  '/admin/autopilot',
  '/admin/autopilots',
  '/admin/automation',
] as const;

/**
 * List of sensitive feature routes (require elevated access in prod)
 */
export const SENSITIVE_ROUTES = [
  '/admin/course-generator',
  '/admin/program-generator',
  '/admin/syllabus-generator',
] as const;

// Re-export API guards — routes import from this path
export { apiAuthGuard, apiRequireAdmin } from '@/lib/authGuards';
