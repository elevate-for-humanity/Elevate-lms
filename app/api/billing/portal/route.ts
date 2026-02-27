import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
    }

    // Stripe billing portal session would be created here
    // For now return a placeholder that redirects to settings
    return NextResponse.json({ url: '/lms/settings/billing' });
  } catch {
    return NextResponse.json({ error: 'Failed to create billing session' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/billing/portal', _POST);
