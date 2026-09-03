import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  generateBlogSocialPackage,
  nextRetryAt,
  publishFacebookPageLink,
  publishFacebookPageReel,
} from '@/lib/social/blog-social-pipeline';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  return Boolean(expected && request.headers.get('authorization') === `Bearer ${expected}`);
}

async function _POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await requireAdminClient();
  const claimToken = crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: candidates, error: readError } = await db
    .from('social_media_posts')
    .select('id,source_id,destination_type,post_type,video_url,attempt_count,link_url')
    .in('status', ['queued', 'failed'])
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order('created_at', { ascending: true })
    .limit(5);
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const candidate of candidates ?? []) {
    const { data: claimed } = await db
      .from('social_media_posts')
      .update({ status: 'generating', claimed_at: now, claim_token: claimToken, updated_at: now })
      .eq('id', candidate.id)
      .in('status', ['queued', 'failed'])
      .select('id')
      .maybeSingle();
    if (!claimed) continue;

    try {
      const { data: blog, error: blogError } = await db
        .from('blog_posts')
        .select('id,title,slug,excerpt,content,social_post_caption')
        .eq('id', candidate.source_id)
        .single();
      if (blogError || !blog) throw new Error('BLOG_SOURCE_MISSING: Published source article was not found.');

      const generated = await generateBlogSocialPackage(blog);
      const message = `${generated.package.caption}\n\n${generated.package.hashtags.join(' ')}`;
      const canonicalLink = new URL(candidate.link_url || `/blog/${blog.slug}`, 'https://www.elevateforhumanity.org').toString();

      if (candidate.destination_type === 'facebook_personal_draft') {
        await db.from('social_media_posts').update({
          status: 'manual_ready', caption: message, content: message,
          generation_payload: { ...generated.package, provider: generated.provider, model: generated.model },
          updated_at: new Date().toISOString(), last_error_code: null, error_message: null,
        }).eq('id', candidate.id).eq('claim_token', claimToken);
        results.push({ id: candidate.id, status: 'manual_ready' });
        continue;
      }

      await db.from('social_media_posts').update({ status: 'publishing', caption: message, content: message }).eq('id', candidate.id).eq('claim_token', claimToken);
      const published = candidate.video_url
        ? await publishFacebookPageReel({ description: message, videoUrl: candidate.video_url })
        : await publishFacebookPageLink({ message, link: canonicalLink });

      await db.from('social_media_posts').update({
        status: 'published', platform_post_id: published.postId, published_url: published.publishedUrl,
        posted_at: new Date().toISOString(), generation_payload: { ...generated.package, provider: generated.provider, model: generated.model },
        last_error_code: null, error_message: null, claim_token: null, claimed_at: null, updated_at: new Date().toISOString(),
      }).eq('id', candidate.id).eq('claim_token', claimToken);
      await db.from('blog_posts').update({ social_posted_at: new Date().toISOString() }).eq('id', blog.id);
      results.push({ id: candidate.id, status: 'published' });
    } catch (error) {
      const attempt = Number(candidate.attempt_count ?? 0) + 1;
      const message = error instanceof Error ? error.message : 'Unknown social publication failure';
      await db.from('social_media_posts').update({
        status: 'failed', attempt_count: attempt, next_attempt_at: nextRetryAt(attempt),
        last_error_code: message.split(':')[0], error_message: message.slice(0, 1000),
        claim_token: null, claimed_at: null, updated_at: new Date().toISOString(),
      }).eq('id', candidate.id).eq('claim_token', claimToken);
      results.push({ id: candidate.id, status: 'failed', error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

export const POST = withApiAudit('/api/internal/social-media/process', _POST);
