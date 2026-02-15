import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { hour_id, reason } = await req.json();

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

    // Check if user has permission to reject hours
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: partnerUser } = await supabase
      .from('partner_users')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.role && ['admin', 'super_admin'].includes(profile.role);
    const isPartner = !!partnerUser;

    if (!isAdmin && !isPartner) {
      return NextResponse.json(
        { error: 'Forbidden - requires admin or partner role' },
        { status: 403 }
      );
    }

    // Reject the hours
    const { error } = await supabase
      .from('training_hours')
      .update({
        status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null,
      })
      .eq('id', hour_id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to reject hours' },
        { status: 500 }
      );
    }

    // Log the rejection
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'hours_rejected',
      entity_type: 'training_hours',
      entity_id: hour_id,
      details: { reason },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: toErrorMessage(err) || 'Failed to reject hours' },
      { status: 500 }
    );
  }
}
