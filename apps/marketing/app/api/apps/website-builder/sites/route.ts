import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PLAN_SITE_LIMITS: Record<string, number | null> = {
  starter: 1,
  professional: 3,
  enterprise: null,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: subscription } = await supabase
    .from('user_app_subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('user_id', user.id)
    .eq('app_slug', 'website-builder')
    .maybeSingle();

  if (!subscription || !['trial', 'active'].includes(subscription.status || '')) {
    return NextResponse.json({ error: 'Website Builder subscription required' }, { status: 403 });
  }

  if (subscription.status === 'trial' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()) {
    return NextResponse.json({ error: 'Website Builder trial has expired' }, { status: 403 });
  }

  const plan = subscription.plan || 'starter';
  const limit = PLAN_SITE_LIMITS[plan] ?? 1;
  if (limit !== null) {
    const { count } = await supabase
      .from('user_websites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count || 0) >= limit) {
      return NextResponse.json({ error: `${plan} plan allows ${limit} website${limit === 1 ? '' : 's'}` }, { status: 409 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const siteName = typeof body.siteName === 'string' && body.siteName.trim()
    ? body.siteName.trim().slice(0, 120)
    : 'My Website';
  const config = buildDefaultSiteConfig({ organizationName: siteName, contactEmail: user.email || undefined });

  const { data: site, error } = await supabase
    .from('user_websites')
    .insert({
      user_id: user.id,
      site_name: siteName,
      template_id: config.template.id,
      site_config: config,
      is_published: false,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, site_name, subdomain, is_published, updated_at')
    .maybeSingle();

  if (error || !site) {
    return NextResponse.json({ error: error?.message || 'Could not create website' }, { status: 500 });
  }

  return NextResponse.json({ website: site }, { status: 201 });
}
