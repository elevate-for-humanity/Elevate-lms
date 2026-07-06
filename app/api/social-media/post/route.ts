import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getSocialTokens } from '@/lib/social/token-resolver';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const VALID_PLATFORMS = ['linkedin', 'facebook', 'youtube', 'instagram'] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const body = await parseBody<Record<string, unknown>>(request);
  const { platform, content, title, media_url, scheduled_for } = body as {
    platform: Platform; content: string; title?: string; media_url?: string; scheduled_for?: string;
  };

  if (!platform || !content) return safeError('platform and content are required', 400);
  if (!VALID_PLATFORMS.includes(platform)) return safeError('Invalid platform', 400);

  if (scheduled_for) {
    const { data: post, error } = await supabase
      .from('social_media_posts')
      .insert({ platform, title, content, media_url, scheduled_for, status: 'scheduled' })
      .select().maybeSingle();
    if (error) return safeError('Failed to schedule post', 500);
    return NextResponse.json({ success: true, message: 'Post scheduled', post });
  }

  const tokens = await getSocialTokens(platform);
  if (!tokens) {
    return safeError(
      `${platform} is not connected. Go to Settings → Social Media to connect your account.`,
      400,
    );
  }

  let result: { success: boolean; post_id?: string; url?: string; error?: string };
  switch (platform) {
    case 'linkedin':  result = await postToLinkedIn(tokens, { title, content, media_url }); break;
    case 'facebook':  result = await postToFacebook(tokens, { content, media_url }); break;
    case 'youtube':   result = await postToYouTube(tokens, { title, content, media_url }); break;
    case 'instagram': result = await postToInstagram(tokens, { content, media_url }); break;
    default:          return safeError('Unknown platform', 400);
  }

  if (!result.success) {
    // YouTube returns a redirect_url instead of posting — pass it through to the client
    if ('redirect_url' in result && result.redirect_url) {
      return NextResponse.json({ success: false, error: result.error, redirect_url: result.redirect_url }, { status: 200 });
    }
    return safeError(result.error ?? 'Post failed', 500);
  }

  const { data: saved } = await supabase
    .from('social_media_posts')
    .insert({ platform, title, content, media_url, posted_at: new Date().toISOString(), status: 'posted', platform_post_id: result.post_id })
    .select().maybeSingle();

  return NextResponse.json({ success: true, message: 'Posted successfully', post: saved, platform_url: result.url });
}

type Tokens = NonNullable<Awaited<ReturnType<typeof getSocialTokens>>>;

async function postToLinkedIn(tokens: Tokens, data: { title?: string; content: string; media_url?: string }) {
  const { access_token, organization_id, profile_data } = tokens;
  const orgId = organization_id || (profile_data as any)?.elements?.[0]?.organization?.id || process.env.LINKEDIN_COMPANY_ID;
  if (!orgId) return { success: false, error: 'LinkedIn organization ID not found. Set LINKEDIN_COMPANY_ID or reconnect.' };

  const body: Record<string, unknown> = {
    author: `urn:li:organization:${orgId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: [data.title, data.content].filter(Boolean).join('\n\n') },
        shareMediaCategory: data.media_url ? 'IMAGE' : 'NONE',
        ...(data.media_url ? { media: [{ status: 'READY', originalUrl: data.media_url }] } : {}),
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { success: false, error: `LinkedIn API error ${res.status}` };
  const result = await res.json();
  return { success: true, post_id: result.id, url: `https://www.linkedin.com/feed/update/${result.id}` };
}

async function postToFacebook(tokens: Tokens, data: { content: string; media_url?: string }) {
  const { access_token, organization_id } = tokens;
  const pageId = organization_id || process.env.FACEBOOK_PAGE_ID;
  if (!pageId) return { success: false, error: 'Facebook Page ID not found. Reconnect your account.' };

  const endpoint = data.media_url
    ? `https://graph.facebook.com/v18.0/${pageId}/photos`
    : `https://graph.facebook.com/v18.0/${pageId}/feed`;
  const params = new URLSearchParams({ access_token, message: data.content });
  if (data.media_url) params.append('url', data.media_url);

  const res = await fetch(`${endpoint}?${params}`, { method: 'POST' });
  if (!res.ok) return { success: false, error: `Facebook API error ${res.status}` };
  const result = await res.json();
  return { success: true, post_id: result.id, url: `https://www.facebook.com/${pageId}/posts/${result.id}` };
}

async function postToYouTube(_tokens: Tokens, _data: { title?: string; content: string; media_url?: string }) {
  // YouTube Data API does not support direct video uploads from server-side OAuth tokens
  // in the same flow as text/image posts. Direct users to YouTube Studio.
  return {
    success: false,
    redirect_url: 'https://studio.youtube.com',
    error: 'YouTube requires uploading via YouTube Studio. Click the link to open Studio.',
  };
}

async function postToInstagram(tokens: Tokens, data: { content: string; media_url?: string }) {
  const { access_token, organization_id } = tokens;
  const accountId = organization_id || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!accountId) return { success: false, error: 'Instagram Business Account ID not found. Reconnect your account.' };
  if (!data.media_url) return { success: false, error: 'Instagram requires an image or video URL.' };

  const containerRes = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: data.media_url, caption: data.content, access_token }),
  });
  if (!containerRes.ok) return { success: false, error: `Instagram container error ${containerRes.status}` };
  const container = await containerRes.json();

  const publishRes = await fetch(`https://graph.facebook.com/v18.0/${accountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token }),
  });
  if (!publishRes.ok) return { success: false, error: `Instagram publish error ${publishRes.status}` };
  const result = await publishRes.json();
  return { success: true, post_id: result.id, url: `https://www.instagram.com/p/${result.id}` };
}

async function postToTwitter(tokens: Tokens, data: { content: string; media_url?: string }) {
  const { access_token } = tokens;
  const tweetBody: Record<string, unknown> = { text: data.content };

  if (data.media_url) {
    const mediaId = await uploadTwitterMedia(access_token, data.media_url);
    if (mediaId) tweetBody.media = { media_ids: [mediaId] };
  }

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(tweetBody),
  });
  if (!res.ok) return { success: false, error: `Twitter API error ${res.status}` };
  const result = await res.json();
  return { success: true, post_id: result.data?.id, url: `https://twitter.com/i/web/status/${result.data?.id}` };
}

async function uploadTwitterMedia(accessToken: string, mediaUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(mediaUrl);
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const res = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ media_data: base64 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.media_id_string ?? null;
  } catch { return null; }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');

  let query = supabase.from('social_media_posts').select('*').order('created_at', { ascending: false });
  if (platform) query = query.eq('platform', platform);
  if (status) query = query.eq('status', status);

  const { data: posts, error } = await query;
  if (error) return safeError('Failed to fetch posts', 500);
  return NextResponse.json({ posts });
}

export const GET = withApiAudit('/api/social-media/post', _GET);
export const POST = withApiAudit('/api/social-media/post', _POST);
