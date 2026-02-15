import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_ROLES = ['student', 'staff', 'instructor', 'admin', 'super_admin'];

/**
 * POST /api/admin/users/role
 * 
 * Update a user's role. Only super_admin can do this.
 * 
 * Body: { email: string, role: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Check if current user is super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentProfile || currentProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can change roles' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
    }

    // Update the user's role
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('email', email)
      .select('id, email, role')
      .single();

    if (error) {
      logger.error('Role update error:', error);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${email} role updated to ${role}`,
      user: data 
    });
  } catch (error) {
    logger.error('Role API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/users/role
 * 
 * List all users with admin/staff roles. Only super_admin can do this.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // Check if current user is super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentProfile || currentProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admins can view roles' }, { status: 403 });
    }

    // Get all admin/staff users
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .in('role', ['admin', 'super_admin', 'staff', 'instructor'])
      .order('role')
      .order('email');

    if (error) {
      logger.error('Fetch admins error:', error);
      return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }

    return NextResponse.json({ admins: admins || [] });
  } catch (error) {
    logger.error('Role API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
