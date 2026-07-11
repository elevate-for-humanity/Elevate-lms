import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/subscriptions/features - List all features
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { data: features, error } = await supabaseAdmin
      .from('features')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching features:', error);
      return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
    }

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/subscriptions/features - Create a new feature
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { code, name, description } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name required' }, { status: 400 });
    }

    // Check if code already exists
    const { data: existing } = await supabaseAdmin
      .from('features')
      .select('id')
      .eq('code', code)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Feature code already exists' }, { status: 400 });
    }

    const { data: feature, error: insertError } = await supabaseAdmin
      .from('features')
      .insert({
        code,
        name,
        description: description || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feature:', insertError);
      return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
    }

    return NextResponse.json({ feature }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/subscriptions/features - Update a feature
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Feature ID required' }, { status: 400 });
    }

    const { data: feature, error: updateError } = await supabaseAdmin
      .from('features')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature:', updateError);
      return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
    }

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/subscriptions/features - Delete a feature
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Feature ID required' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('features')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting feature:', deleteError);
      return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
