import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Get user's organization
    const { data: profile } = await adminClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id') || user.id;

    const { data, error } = await adminClient
      .from('workone_checklist')
      .select(
        'id,user_id,step_key,step_label,status,notes,due_date,completed_at,updated_at'
      )
      .eq('organization_id', profile.organization_id)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] }, { status: 200 });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      {
        error:
          (error instanceof Error ? error.message : String(error)) ||
          'Internal server err',
      },
      { status: 500 }
    );
  }
}
