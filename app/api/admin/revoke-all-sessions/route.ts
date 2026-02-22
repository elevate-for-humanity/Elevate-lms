export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get target user ID from request
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Use admin client to revoke all sessions
    const adminSupabase = await createClient();
    
    // Sign out user from all devices
    const { error: signOutError } = await adminSupabase.auth.admin.signOut(userId);

    if (signOutError) {
      return NextResponse.json(
        { error: 'Failed to revoke sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `All sessions revoked for user ${userId}`,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error', details: 'Internal server error' },
      { status: 500 }
    );
  }
}
