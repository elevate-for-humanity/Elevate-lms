/**
 * Demo Auth Wrapper
 * Ensures operations are restricted to demo tenant context
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isDemoTenant, getDemoTenantSlug } from './context';

const ALLOWED_DEMO_ROLES: DemoRole[] = ['demo_admin', 'demo_staff', 'demo_partner', 'demo_learner', 'super_admin'];

export interface DemoAuthResult {
  userId: string;
  role: DemoRole;
  tenantSlug: string;
  isDemo: true;
}

/**
 * Require demo context for a page or API route
 * Returns user info if in demo context, redirects otherwise
 */
export async function requireDemo(): Promise<DemoAuthResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/demo?message=${encodeURIComponent('Please sign in to access the demo')}`);
  }
  
  // Get user profile with tenant info
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id, tenants(slug)')
    .eq('id', user.id)
    .single();
  
  const tenantSlug = (profile?.tenants as any)?.slug || null;
  const userRole = profile?.role as DemoRole;
  
  // Check if user is in demo tenant
  if (!isDemoTenant(tenantSlug)) {
    redirect(`/demo?message=${encodeURIComponent('Demo features are only available in the demo environment')}`);
  }
  
  // Check if user has allowed demo role
  if (!ALLOWED_DEMO_ROLES.includes(userRole)) {
    redirect(`/demo?message=${encodeURIComponent('Your role does not have access to demo features')}`);
  }
  
  return {
    userId: user.id,
    role: userRole,
    tenantSlug: getDemoTenantSlug(),
    isDemo: true,
  };
}

/**
 * Check if current request is in demo context (non-blocking)
 * Returns null if not in demo context
 */
export async function checkDemoContext(): Promise<DemoAuthResult | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id, tenants(slug)')
      .eq('id', user.id)
      .single();
    
    const tenantSlug = (profile?.tenants as any)?.slug || null;
    const userRole = profile?.role as DemoRole;
    
    if (!isDemoTenant(tenantSlug)) return null;
    if (!ALLOWED_DEMO_ROLES.includes(userRole)) return null;
    
    return {
      userId: user.id,
      role: userRole,
      tenantSlug: getDemoTenantSlug(),
      isDemo: true,
    };
  } catch {
    return null;
  }
}

/**
 * Require demo admin role (for seed/reset operations)
 */
export async function requireDemoAdmin(): Promise<DemoAuthResult> {
  const result = await requireDemo();
  
  if (result.role !== 'demo_admin' && result.role !== 'super_admin') {
    redirect(`/demo?message=${encodeURIComponent('Admin access required for this operation')}`);
  }
  
  return result;
}
