import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CampaignBody = {
  name?: string;
  contentSource?: 'blog' | 'ai' | 'manual';
  platforms?: string[];
  frequency?: string;
  times?: string[];
  program?: string;
  duration?: string | number;
  status?: 'draft' | 'active' | 'paused';
};

const _GET = withAuth(
  async () => {
    const db = await requireAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data, error } = await db
      .from('social_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaigns: data ?? [] });
  },
  { roles: ['admin'] },
);

const _POST = withAuth(
  async (req: NextRequest) => {
    const body = (await req.json().catch(() => ({}))) as CampaignBody;
    const db = await requireAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const name = body.name?.trim();
    const platforms = Array.from(new Set((body.platforms ?? []).filter(Boolean)));
    const status = body.status ?? 'draft';

    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }
    if (platforms.length === 0) {
      return NextResponse.json({ error: 'Select at least one social platform' }, { status: 400 });
    }

    if (status === 'active') {
      const { data: connected, error: accountError } = await db
        .from('social_media_settings')
        .select('platform')
        .in('platform', platforms)
        .eq('enabled', true)
        .not('access_token', 'is', null);

      if (accountError) {
        return NextResponse.json({ error: accountError.message }, { status: 500 });
      }

      const connectedPlatforms = new Set((connected ?? []).map((row) => row.platform));
      const missing = platforms.filter((platform) => !connectedPlatforms.has(platform));
      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: 'Campaign cannot be activated until the selected social accounts are connected.',
            disconnectedPlatforms: missing,
          },
          { status: 409 },
        );
      }
    }

    const durationDays = Math.max(1, Math.min(Number(body.duration) || 30, 365));
    const start = new Date();
    const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data, error } = await db
      .from('social_campaigns')
      .insert({
        name,
        platform: platforms.join(','),
        status,
        scheduled_posts: 0,
        published_posts: 0,
        failed_posts: 0,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        metadata: {
          contentSource: body.contentSource ?? 'blog',
          platforms,
          frequency: body.frequency ?? 'daily',
          times: body.times ?? [],
          program: body.program ?? 'all',
          durationDays,
        },
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, campaign: data }, { status: 201 });
  },
  { roles: ['admin'] },
);

export const GET = withApiAudit('/api/social-media/campaigns', _GET);
export const POST = withApiAudit('/api/social-media/campaigns', _POST);
