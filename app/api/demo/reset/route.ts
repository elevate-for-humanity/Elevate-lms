import { logger } from '@/lib/logger';
/**
 * Demo Reset API
 * Clears demo tenant data and re-seeds fresh state
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isDemoEnabled, getDemoTenantSlug } from '@/lib/demo/context';

export const dynamic = 'force-dynamic';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export async function POST() {
  try {
    // Check if demo mode is enabled
    if (!isDemoEnabled()) {
      return NextResponse.json(
        { error: 'Demo mode is not enabled' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const demoSlug = getDemoTenantSlug();
    const deletedCounts: Record<string, number> = {};

    // Delete in order to respect foreign key constraints
    // Only delete records belonging to demo tenant

    // 1. Delete audit logs for demo tenant users
    const { count: auditCount } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .in('user_id', [
        '00000000-0000-0000-0000-000000000010',
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000013',
      ]);
    deletedCounts.audit_logs = auditCount || 0;

    // 2. Delete enrollments for demo tenant
    const { count: enrollmentCount } = await supabase
      .from('enrollments')
      .delete({ count: 'exact' })
      .eq('tenant_id', DEMO_TENANT_ID);
    deletedCounts.enrollments = enrollmentCount || 0;

    // 3. Delete courses for demo tenant
    const { count: courseCount } = await supabase
      .from('courses')
      .delete({ count: 'exact' })
      .eq('tenant_id', DEMO_TENANT_ID);
    deletedCounts.courses = courseCount || 0;

    // 4. Delete programs for demo tenant
    const { count: programCount } = await supabase
      .from('programs')
      .delete({ count: 'exact' })
      .eq('tenant_id', DEMO_TENANT_ID);
    deletedCounts.programs = programCount || 0;

    // 5. Delete profiles for demo tenant (keep tenant itself)
    const { count: profileCount } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('tenant_id', DEMO_TENANT_ID);
    deletedCounts.profiles = profileCount || 0;

    // 6. Now re-seed by calling the seed endpoint
    const seedUrl = new URL('/api/demo/seed', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    const seedResponse = await fetch(seedUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const seedResult = await seedResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Demo data reset successfully',
      deleted: deletedCounts,
      seeded: seedResult.results || {},
    });

  } catch (error) {
    logger.error('Demo reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset demo data', details: String(error) },
      { status: 500 }
    );
  }
}
