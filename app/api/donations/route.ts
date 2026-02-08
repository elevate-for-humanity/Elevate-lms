import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');
    const isAdmin = searchParams.get('admin') === 'true';

    // If admin view, verify permissions
    if (isAdmin) {
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Admin can see all donations
      let query = supabase
        .from('donations')
        .select('*, campaign:campaign_id(name)')
        .order('created_at', { ascending: false });

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data: donations, error } = await query;

      if (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
      }

      // Calculate totals
      const totalAmount =
        donations?.reduce((sum, d) => {
          if (d.payment_status === 'succeeded') {
            return sum + parseFloat(d.amount || '0');
          }
          return sum;
        }, 0) || 0;

      const totalDonations =
        donations?.filter((d) => d.payment_status === 'succeeded').length || 0;

      return NextResponse.json({
        donations,
        total: donations?.length || 0,
        totalAmount,
        totalDonations,
      });
    }

    // User view - only their own donations
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: donations, error } = await supabase
      .from('donations')
      .select('*, campaign:campaign_id(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }

    const totalAmount =
      donations?.reduce((sum, d) => {
        if (d.payment_status === 'succeeded') {
          return sum + parseFloat(d.amount || '0');
        }
        return sum;
      }, 0) || 0;

    return NextResponse.json({
      donations,
      total: donations?.length || 0,
      totalAmount,
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
