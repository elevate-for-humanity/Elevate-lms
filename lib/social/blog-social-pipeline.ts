import { z } from 'zod';
import { aiChat } from '@/lib/ai/ai-service';
import { getSocialTokens } from '@/lib/social/token-resolver';

const SocialPackageSchema = z.object({
  caption: z.string().min(40).max(1800),
  hook: z.string().min(8).max(180),
  voiceover: z.string().min(40).max(1400),
  scenes: z.array(z.object({
    seconds: z.number().int().min(2).max(10),
    visual: z.string().min(8).max(300),
    overlay: z.string().min(1).max(120),
  })).min(3).max(10),
  hashtags: z.array(z.string().regex(/^#[A-Za-z0-9_]+$/)).min(2).max(12),
  cta: z.string().min(8).max(180),
});

export type SocialPackage = z.infer<typeof SocialPackageSchema>;

export type BlogSocialSource = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  social_post_caption?: string | null;
};

function parseJsonObject(value: string): unknown {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

export async function generateBlogSocialPackage(blog: BlogSocialSource): Promise<{
  package: SocialPackage;
  provider: string;
  model: string;
}> {
  const result = await aiChat({
    messages: [
      {
        role: 'system',
        content: 'You create accurate, original workforce-development social content. Return only valid JSON. Never invent funding eligibility, licensing approval, guaranteed outcomes, wages, or credentials.',
      },
      {
        role: 'user',
        content: `Convert this Elevate for Humanity blog into one Facebook caption and a 25-45 second vertical Reel production plan. Keep all claims supported by the supplied article. The call to action must point readers to https://www.elevateforhumanity.org/blog/${blog.slug}.\n\nTitle: ${blog.title}\nExcerpt: ${blog.excerpt ?? ''}\nArticle: ${(blog.content ?? '').slice(0, 12000)}\nPreferred caption: ${blog.social_post_caption ?? ''}\n\nReturn JSON exactly as {"caption":"...","hook":"...","voiceover":"...","scenes":[{"seconds":4,"visual":"...","overlay":"..."}],"hashtags":["#ElevateForHumanity"],"cta":"..."}.`,
      },
    ],
    temperature: 0.35,
    maxTokens: 2200,
  });

  return {
    package: SocialPackageSchema.parse(parseJsonObject(result.content)),
    provider: result.provider ?? 'configured',
    model: result.model,
  };
}

const graphVersion = () => process.env.META_GRAPH_API_VERSION?.trim() || 'v26.0';

async function graphRequest(path: string, body: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(`https://graph.facebook.com/${graphVersion()}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || payload.error) {
    const providerMessage = typeof payload.error === 'object' && payload.error
      ? String((payload.error as Record<string, unknown>).message ?? 'Meta rejected the request')
      : 'Meta rejected the request';
    throw new Error(`META_PUBLISH_FAILED: ${providerMessage}`);
  }
  return payload;
}

export async function publishFacebookPageLink(input: {
  message: string;
  link: string;
}): Promise<{ postId: string; publishedUrl: string }> {
  const tokens = await getSocialTokens('facebook');
  const pageId = tokens?.organization_id?.trim();
  if (!tokens?.access_token || !pageId) {
    throw new Error('META_PAGE_NOT_CONNECTED: Connect the Elevate Facebook Page in Admin settings.');
  }

  const payload = await graphRequest(`${encodeURIComponent(pageId)}/feed`, new URLSearchParams({
    message: input.message,
    link: input.link,
    access_token: tokens.access_token,
  }));
  const postId = String(payload.id ?? '');
  if (!postId) throw new Error('META_INVALID_RESPONSE: Facebook returned no post ID.');
  return { postId, publishedUrl: `https://www.facebook.com/${postId.replace('_', '/posts/')}` };
}

export async function publishFacebookPageReel(input: {
  description: string;
  videoUrl: string;
}): Promise<{ postId: string; publishedUrl: string }> {
  const tokens = await getSocialTokens('facebook');
  const pageId = tokens?.organization_id?.trim();
  if (!tokens?.access_token || !pageId) {
    throw new Error('META_PAGE_NOT_CONNECTED: Connect the Elevate Facebook Page in Admin settings.');
  }

  const start = await graphRequest(`${encodeURIComponent(pageId)}/video_reels`, new URLSearchParams({
    upload_phase: 'start',
    access_token: tokens.access_token,
  }));
  const videoId = String(start.video_id ?? '');
  if (!videoId) throw new Error('META_INVALID_RESPONSE: Facebook returned no Reel video ID.');

  await graphRequest(`${encodeURIComponent(videoId)}`, new URLSearchParams({
    upload_phase: 'transfer',
    file_url: input.videoUrl,
    access_token: tokens.access_token,
  }));
  await graphRequest(`${encodeURIComponent(pageId)}/video_reels`, new URLSearchParams({
    upload_phase: 'finish',
    video_id: videoId,
    video_state: 'PUBLISHED',
    description: input.description,
    access_token: tokens.access_token,
  }));

  return { postId: videoId, publishedUrl: `https://www.facebook.com/reel/${videoId}` };
}

export function nextRetryAt(attempt: number): string {
  const boundedAttempt = Math.max(1, Math.min(attempt, 6));
  return new Date(Date.now() + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** (boundedAttempt - 1))).toISOString();
}
