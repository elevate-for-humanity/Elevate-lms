import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { generateBlogSocialPackage } from '@/lib/social/blog-social-pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenerateBody = {
  contentSource?: 'blog' | 'ai' | 'manual';
  count?: number;
  program?: string;
};

const _POST = withAuth(
  async (req: NextRequest) => {
    const body = (await req.json().catch(() => ({}))) as GenerateBody;
    const contentSource = body.contentSource ?? 'blog';
    const count = Math.max(1, Math.min(Number(body.count) || 12, 90));

    if (contentSource === 'manual') {
      return NextResponse.json({
        success: true,
        posts: [],
        source: 'manual',
        message: 'Manual campaigns are authored in the campaign editor and are not auto-generated.',
      });
    }

    if (contentSource === 'ai') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI social generation is not enabled on this route yet. Use Blog Posts or Manual until a verified AI provider is configured.',
        },
        { status: 501 },
      );
    }

    const db = await requireAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const { data: posts, error } = await db
      .from('blog_posts')
      .select('id,title,slug,excerpt,social_post_caption,published_at')
      .eq('published', true)
      .eq('share_to_social', true)
      .order('published_at', { ascending: false })
      .limit(count);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const generated = await Promise.all((posts ?? []).map(async (post) => {
      const result = await generateBlogSocialPackage(post);
      return {
        blogId: post.id,
        caption: `${result.package.caption}\n\n${result.package.hashtags.join(' ')}`,
        reel: result.package,
        provider: result.provider,
        model: result.model,
      };
    }));

    return NextResponse.json({
      success: true,
      posts: generated,
      source: 'blog_posts',
      count: generated.length,
      program: body.program ?? 'all',
    });
  },
  { roles: ['admin'] },
);

export const POST = withApiAudit('/api/social-media/generate', _POST);
