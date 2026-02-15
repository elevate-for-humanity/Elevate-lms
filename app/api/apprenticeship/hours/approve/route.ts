import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';

export async function POST(req: Request) {
  try {
    const { hour_id } = await req.json();

    if (!hour_id) {
      return NextResponse.json(
        { error: 'Hour ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/sponsor/employer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'sponsor', 'employer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin/sponsor/employer role' },
        { status: 403 }
      );
    }

    // Approve the hours
    const { error } = await supabase
      .from('apprenticeship_hours')
      .update({
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', hour_id);

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to approve hours' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to approve hours' },
      { status: 500 }
    );
  }
}

// Bulk approve
export async function PUT(req: Request) {
  try {
    const { hour_ids } = await req.json();

    if (!hour_ids || !Array.isArray(hour_ids)) {
      return NextResponse.json(
        { error: 'Hour IDs array is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/sponsor/employer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'sponsor', 'employer'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin/sponsor/employer role' },
        { status: 403 }
      );
    }

    // Bulk approve
    const { error } = await supabase
      .from('apprenticeship_hours')
      .update({
        approved: true,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .in('id', hour_ids);

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: 'Failed to approve hours' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: hour_ids.length });
  } catch (err: any) {
    // Error: $1
    return NextResponse.json(
      { err: toErrorMessage(err) || 'Failed to approve hours' },
      { status: 500 }
    );
  }
}
