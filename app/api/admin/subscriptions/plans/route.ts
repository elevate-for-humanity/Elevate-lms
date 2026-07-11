import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@supabase/supabase-js';

// Lazy admin client for server-side operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(url, key);
}

// GET /api/admin/subscriptions/plans - List all plans with features
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all plans with their features
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select(`
        *,
        plan_features (
          features (
            id,
            code,
            name,
            description
          )
        )
      `)
      .order('sort_order', { ascending: true });

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    // Transform to flatten features
    const transformedPlans = (plans || []).map((plan: any) => ({
      ...plan,
      features: plan.plan_features?.map((pf: any) => pf.features) || []
    }));

    return NextResponse.json({ plans: transformedPlans });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/subscriptions/plans - Create a new plan
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { name, slug, monthly_price, annual_price, limits } = body;

    if (!name || !slug || monthly_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Plan slug already exists' }, { status: 400 });
    }

    // Get max sort_order
    const { data: maxOrder } = await supabaseAdmin
      .from('subscription_plans')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const newSortOrder = (maxOrder?.sort_order || 0) + 1;

    // Create the plan
    const { data: plan, error: insertError } = await supabaseAdmin
      .from('subscription_plans')
      .insert({
        name,
        slug,
        monthly_price,
        annual_price: annual_price || null,
        limits: limits || {},
        sort_order: newSortOrder,
        active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating plan:', insertError);
      return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/subscriptions/plans - Update a plan
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    const { data: plan, error: updateError } = await supabaseAdmin
      .from('subscription_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating plan:', updateError);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/subscriptions/plans - Delete a plan
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Check for active subscriptions
    const { data: subscriptions } = await supabaseAdmin
      .from('organization_subscriptions')
      .select('id')
      .eq('plan_id', id)
      .in('status', ['active', 'trialing'])
      .limit(1);

    if (subscriptions && subscriptions.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete plan with active subscriptions' 
      }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting plan:', deleteError);
      return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
