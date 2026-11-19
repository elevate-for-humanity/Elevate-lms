import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { publicSocialImageUrl } from '@/lib/social/publishing-readiness';
import { generateBlogSocialPackage } from '@/lib/social/blog-social-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CampaignBody = {
  name?: string;
  requestId?: string;
  contentSource?: 'blog' | 'ai' | 'manual';
  platforms?: string[];
  frequency?: string;
  times?: string[];
  program?: string;
  duration?: string | number;
  status?: 'draft' | 'active' | 'paused';
  sourceBlogIds?: string[];
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
  async (req: NextRequest, context) => {
    const body = (await req.json().catch(() => ({}))) as CampaignBody;
    const db = await requireAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const name = body.name?.trim();
    const requestId = typeof body.requestId === 'string' ? body.requestId.toLowerCase() : body.requestId;
    if (typeof requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return NextResponse.json({ error: 'A valid campaign save request ID is required' }, { status: 400 });
    }
    const platforms = Array.from(new Set((body.platforms ?? []).filter(Boolean)));
    const status = body.status ?? 'draft';
    if (!['draft', 'active', 'paused'].includes(status)) {
      return NextResponse.json({ error: 'Invalid campaign status' }, { status: 400 });
    }

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

    const sourceBlogIds = Array.from(new Set(body.sourceBlogIds ?? [])).slice(0, 90);
    const metadata = {
      contentSource: body.contentSource ?? 'blog',
      platforms,
      frequency: body.frequency ?? 'daily',
      times: body.times ?? [],
      program: body.program ?? 'all',
      durationDays,
      sourceBlogIds,
      approvalPolicy: 'per-post-admin-approval',
      generator: 'elevate-deterministic',
    };
    const campaign = {
      id: requestId,
      name,
      platform: platforms.length === 1 ? platforms[0] : 'multi',
      status,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      metadata: {
        ...metadata,
        saveActorId: context.user.id,
        saveFingerprint: createHash('sha256')
          .update(JSON.stringify({ name, status, ...metadata }))
          .digest('hex'),
      },
    };

    const rows: Array<Record<string, unknown>> = [];
    if (sourceBlogIds.length > 0) {
      const { data: sourceBlogs, error: sourceError } = await db
        .from('blog_posts')
        .select('id,title,slug,excerpt,content,social_post_caption,featured_image,image,updated_at')
        .in('id', sourceBlogIds)
        .eq('published', true)
        .eq('share_to_social', true);
      if (sourceError) {
        return NextResponse.json({ error: 'Campaign articles could not be loaded. No campaign was saved.' }, { status: 500 });
      }
      if ((sourceBlogs ?? []).length !== sourceBlogIds.length) {
        return NextResponse.json({ error: 'One or more selected articles are no longer available for social sharing. Rebuild the draft packages.' }, { status: 409 });
      }

      for (const blog of sourceBlogs ?? []) {
        const generated = await generateBlogSocialPackage(blog);
        const caption = `${generated.package.caption}\n\n${generated.package.hashtags.join(' ')}`;
        const approvedImage =
          publicSocialImageUrl(blog.featured_image) ?? publicSocialImageUrl(blog.image);
        const version = String(blog.updated_at || blog.id)
          .replace(/[^A-Za-z0-9]/g, '')
          .slice(0, 24);
        const common = {
          title: blog.title,
          content: caption,
          caption,
          status: 'pending_approval',
          approval_state: 'pending',
          approved_at: null,
          source_type: 'blog_post',
          source_id: blog.id,
          link_url: `/blog/${blog.slug}`,
          media_url: approvedImage,
          thumbnail_url: approvedImage,
          content_version: version,
          generation_payload: {
            ...generated.package,
            campaignId: campaign.id,
            provider: generated.provider,
            model: generated.model,
          },
          scheduled_at: null,
          next_attempt_at: null,
          updated_at: new Date().toISOString(),
        };

        if (platforms.includes('facebook')) {
          rows.push({
            ...common,
            platform: 'facebook',
            destination_type: 'facebook_page',
            post_type: 'blog_link',
            idempotency_key: `campaign:${campaign.id}:blog:${blog.id}:facebook_page:${version}`,
          });
        }
        if (platforms.includes('instagram') && approvedImage) {
          rows.push({
            ...common,
            platform: 'instagram',
            destination_type: 'instagram_image',
            post_type: 'image',
            idempotency_key: `campaign:${campaign.id}:blog:${blog.id}:instagram_image:${version}`,
          });
        }
      }
    }

    // One database transaction owns both the plan and its unapproved post rows.
    // The RPC matches the existing partial unique index and replays the same
    // save request without duplicating a campaign after a lost response.
    const { data: saved, error: saveError } = await db.rpc('save_social_campaign_draft', {
      p_campaign: campaign,
      p_posts: rows,
    });
    if (saveError) {
      return NextResponse.json(
        { error: saveError.code === '22023'
          ? 'This save request has changed. Reload the campaign editor before saving again.'
          : 'Campaign and post drafts could not be saved. No partial campaign was created. Retry this save.' },
        { status: saveError.code === '22023' ? 409 : 500 },
      );
    }
    return NextResponse.json({ success: true, ...saved }, { status: saved?.replayed ? 200 : 201 });
  },
  { roles: ['admin'] },
);

export const GET = withApiAudit('/api/social-media/campaigns', _GET);
export const POST = withApiAudit('/api/social-media/campaigns', _POST);
