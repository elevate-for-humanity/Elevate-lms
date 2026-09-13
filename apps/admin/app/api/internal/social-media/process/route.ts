import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  generateBlogSocialPackage,
  nextRetryAt,
  publishFacebookPageLink,
  publishFacebookPageReel,
  publishInstagramImage,
  publishInstagramReel,
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
  const { data: candidates, error: readError } = await db.rpc('claim_due_social_posts', {
    p_claim_token: claimToken,
    p_limit: 5,
  });
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const candidate of candidates ?? []) {
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
          claim_token: null, claimed_at: null, claim_expires_at: null,
        }).eq('id', candidate.id).eq('claim_token', claimToken);
        results.push({ id: candidate.id, status: 'manual_ready' });
        continue;
      }

      await db.from('social_media_posts').update({ status: 'publishing', caption: message, content: message }).eq('id', candidate.id).eq('claim_token', claimToken);
      let published: { postId: string; publishedUrl: string };
      if (candidate.destination_type === 'instagram_reel') {
        if (!candidate.video_url) throw new Error('INSTAGRAM_VIDEO_REQUIRED: Reel is missing a video URL.');
        published = await publishInstagramReel({ caption: message, videoUrl: candidate.video_url });
      } else if (candidate.destination_type === 'instagram_image') {
        const imageUrl = candidate.media_url || candidate.thumbnail_url;
        if (!imageUrl) throw new Error('INSTAGRAM_IMAGE_REQUIRED: Instagram post is missing an image URL.');
        published = await publishInstagramImage({ caption: message, imageUrl });
      } else if (candidate.destination_type === 'facebook_page') {
        published = candidate.video_url
          ? await publishFacebookPageReel({ description: message, videoUrl: candidate.video_url })
          : await publishFacebookPageLink({ message, link: canonicalLink });
      } else {
        throw new Error(`DESTINATION_NOT_IMPLEMENTED: ${candidate.destination_type || 'missing destination'}`);
      }

      await db.from('social_media_posts').update({
        status: 'published', platform_post_id: published.postId, published_url: published.publishedUrl,
        posted_at: new Date().toISOString(), generation_payload: { ...generated.package, provider: generated.provider, model: generated.model },
        last_error_code: null, error_message: null, claim_token: null, claimed_at: null,
        claim_expires_at: null, updated_at: new Date().toISOString(),
      }).eq('id', candidate.id).eq('claim_token', claimToken);
      await db.from('blog_posts').update({ social_posted_at: new Date().toISOString() }).eq('id', blog.id);
      results.push({ id: candidate.id, status: 'published' });
    } catch (error) {
      const attempt = Number(candidate.attempt_count ?? 0) + 1;
      const message = error instanceof Error ? error.message : 'Unknown social publication failure';
      const errorCode = message.split(':')[0];
      const configurationRequired = errorCode.endsWith('_DRY_RUN') || errorCode.endsWith('_NOT_CONNECTED') ||
        errorCode === 'DESTINATION_NOT_IMPLEMENTED';
      const deadLetter = attempt >= Number(candidate.max_attempts ?? 6);
      await db.from('social_media_posts').update({
        status: configurationRequired ? 'configuration_required' : deadLetter ? 'dead_letter' : 'failed', attempt_count: attempt,
        next_attempt_at: configurationRequired || deadLetter ? null : nextRetryAt(attempt),
        dead_lettered_at: deadLetter ? new Date().toISOString() : null,
        last_error_code: errorCode, error_message: message.slice(0, 1000),
        claim_token: null, claimed_at: null, claim_expires_at: null, updated_at: new Date().toISOString(),
      }).eq('id', candidate.id).eq('claim_token', claimToken);
      results.push({ id: candidate.id, status: configurationRequired ? 'configuration_required' : deadLetter ? 'dead_letter' : 'failed', error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

export const POST = withApiAudit('/api/internal/social-media/process', _POST);
