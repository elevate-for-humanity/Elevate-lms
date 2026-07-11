import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/subscriptions/plans/features - Add feature to plan
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { plan_id, feature_id } = body;

    if (!plan_id || !feature_id) {
      return NextResponse.json({ error: 'plan_id and feature_id required' }, { status: 400 });
    }

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('plan_features')
      .select('*')
      .eq('plan_id', plan_id)
      .eq('feature_id', feature_id)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Feature already assigned to plan' });
    }

    const { error: insertError } = await supabaseAdmin
      .from('plan_features')
      .insert({
        plan_id,
        feature_id
      });

    if (insertError) {
      console.error('Error adding feature to plan:', insertError);
      return NextResponse.json({ error: 'Failed to add feature' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/subscriptions/plans/features - Remove feature from plan
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { plan_id, feature_id } = body;

    if (!plan_id || !feature_id) {
      return NextResponse.json({ error: 'plan_id and feature_id required' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('plan_features')
      .delete()
      .eq('plan_id', plan_id)
      .eq('feature_id', feature_id);

    if (deleteError) {
      console.error('Error removing feature from plan:', deleteError);
      return NextResponse.json({ error: 'Failed to remove feature' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
