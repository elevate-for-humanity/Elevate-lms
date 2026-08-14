/**
 * Fix Profile Data API
 * 
 * Creates missing profiles for auth users and fixes invalid roles.
 * Admin-only endpoint.
 * 
 * POST /api/admin/profiles/fix
 * Body: { action: 'sync-all' | 'create-missing' | 'fix-roles' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const VALID_ROLES = new Set([
  'student', 'instructor', 'admin', 'staff', 'admin',
  'program_holder', 'provider_admin', 'case_manager', 'employer', 'partner', 'delegate',
  'workforce_board', 'grant_client', 'sponsor', 'creator', 'org_admin',
]);

async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'sync-all';

    const db = await requireAdminClient();
    const results = { created: 0, fixed: 0, errors: [] as string[] };

    // 1. Get all auth users
    const { data: authUsers, error: listError } = await db.auth.admin.listUsers();
    if (listError) {
      logger.error('Failed to list auth users:', listError);
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 });
    }

    // 2. Get existing profiles
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email, role');

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // 3. Process each auth user
    for (const authUser of authUsers.users || []) {
      try {
        const existingProfile = profileMap.get(authUser.id);
        const authEmail = (authUser.email || '').toLowerCase().trim();

        // Create missing profile
        if (!existingProfile) {
          if (action === 'sync-all' || action === 'create-missing') {
            const { error: insertError } = await db
              .from('profiles')
              .insert({
                id: authUser.id,
                email: authEmail,
                full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
                role: 'student',
              });

            if (insertError) {
              results.errors.push(`Failed to create profile for ${authEmail}: ${insertError.message}`);
            } else {
              results.created++;
              logger.info(`Created profile for ${authEmail}`);
            }
          }
          continue;
        }

        // Fix invalid/missing role
        const role = (existingProfile.role || '').trim().toLowerCase();
        if (!role || !VALID_ROLES.has(role)) {
          if (action === 'sync-all' || action === 'fix-roles') {
            const { error: updateError } = await db
              .from('profiles')
              .update({ role: 'student', email: authEmail })
              .eq('id', authUser.id);

            if (updateError) {
              results.errors.push(`Failed to fix role for ${authEmail}: ${updateError.message}`);
            } else {
              results.fixed++;
              logger.info(`Fixed role for ${authEmail}`);
            }
          }
        }

        // Sync email if different
        const profileEmail = (existingProfile.email || '').toLowerCase().trim();
        if (authEmail && profileEmail !== authEmail) {
          await db.from('profiles').update({ email: authEmail }).eq('id', authUser.id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.errors.push(`Error processing user ${authUser.id}: ${msg}`);
      }
    }

    logger.info('Profile fix completed:', results);
    return NextResponse.json({
      success: true,
      action,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    logger.error('Profile fix API error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

