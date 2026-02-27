import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

import { auditMutation } from '@/lib/api/withAudit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fields } = body;

    if (!fields || typeof fields !== 'object') {
      return NextResponse.json({ error: 'fields object required' }, { status: 400 });
    }

    // Only allow updating own profile, add updated_at
    const { error } = await db.from('profiles').update({
      ...fields,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      logger.error('[Profile] Update failed:', error.message);
      return NextResponse.json({ success: false, error: 'Profile update failed' }, { status: 500 });
    }

    await auditMutation(request, {
      action: 'user_updated',
      target_type: 'profile',
      target_id: user.id,
      user_id: user.id,
      metadata: { self_update: true, fields: Object.keys(fields) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('[Profile] API error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await db.from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
