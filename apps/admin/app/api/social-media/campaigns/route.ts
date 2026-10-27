import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { generateBlogSocialPackage } from '@/lib/social/blog-social-pipeline';

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
        platform: platforms.length === 1 ? platforms[0] : 'multi',
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
          sourceBlogIds: Array.from(new Set(body.sourceBlogIds ?? [])).slice(0, 90),
          approvalPolicy: 'per-post-admin-approval',
          generator: 'elevate-deterministic',
        },
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const sourceBlogIds = Array.from(new Set(body.sourceBlogIds ?? [])).slice(0, 90);
    let draftCount = 0;
    if (sourceBlogIds.length > 0) {
      const { data: sourceBlogs, error: sourceError } = await db
        .from('blog_posts')
        .select('id,title,slug,excerpt,content,social_post_caption,featured_image,image,updated_at')
        .in('id', sourceBlogIds)
        .eq('published', true)
        .eq('share_to_social', true);
      if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 500 });

      const rows: Array<Record<string, unknown>> = [];
      for (const blog of sourceBlogs ?? []) {
        const generated = await generateBlogSocialPackage(blog);
        const caption = `${generated.package.caption}\n\n${generated.package.hashtags.join(' ')}`;
        const approvedImage = blog.featured_image || blog.image || null;
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
            campaignId: data.id,
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
            idempotency_key: `campaign:${data.id}:blog:${blog.id}:facebook_page:${version}`,
          });
          rows.push({
            ...common,
            platform: 'facebook',
            destination_type: 'facebook_personal_draft',
            post_type: 'reel_draft',
            idempotency_key: `campaign:${data.id}:blog:${blog.id}:facebook_personal_draft:${version}`,
          });
        }
        if (
          platforms.includes('instagram') &&
          typeof approvedImage === 'string' &&
          approvedImage.startsWith('https://')
        ) {
          rows.push({
            ...common,
            platform: 'instagram',
            destination_type: 'instagram_image',
            post_type: 'image',
            idempotency_key: `campaign:${data.id}:blog:${blog.id}:instagram_image:${version}`,
          });
        }
      }

      if (rows.length > 0) {
        const { data: drafts, error: draftError } = await db
          .from('social_media_posts')
          .upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true })
          .select('id');
        if (draftError) return NextResponse.json({ error: draftError.message }, { status: 500 });
        draftCount = drafts?.length ?? 0;
        await db.from('social_campaigns').update({ scheduled_posts: draftCount }).eq('id', data.id);
      }
    }

    return NextResponse.json({ success: true, campaign: data, draftCount }, { status: 201 });
  },
  { roles: ['admin'] },
);

export const GET = withApiAudit('/api/social-media/campaigns', _GET);
export const POST = withApiAudit('/api/social-media/campaigns', _POST);
