
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * POST /api/social-media/post
 * Post content to social media platforms
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { platform, content, title, media_url, scheduled_for } = body;

    if (!platform || !content) {
      return NextResponse.json(
        { error: 'Platform and content are required' },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = [
      'linkedin',
      'facebook',
      'youtube',
      'instagram',
      'twitter',
    ];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    // Check if platform is enabled
    const platformEnabled =
      process.env[`SOCIAL_MEDIA_${platform.toUpperCase()}_ENABLED`] === 'true';
    if (!platformEnabled) {
      return NextResponse.json(
        { error: `${platform} is not enabled` },
        { status: 400 }
      );
    }

    // Post immediately or schedule
    if (scheduled_for) {
      // Schedule post
      const { data: scheduledPost, error: scheduleError } = await supabase
        .from('social_media_posts')
        .insert({
          platform,
          title,
          content,
          media_url,
          scheduled_for,
          status: 'scheduled',
        })
        .select()
        .single();

      if (scheduleError) {
        return NextResponse.json(
          { error: 'Failed to schedule post' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Post scheduled successfully',
        post: scheduledPost,
      });
    } else {
      // Post immediately
      let result;
      switch (platform) {
        case 'linkedin':
          result = await postToLinkedIn({ title, content, media_url });
          break;
        case 'facebook':
          result = await postToFacebook({ content, media_url });
          break;
        case 'youtube':
          result = await postToYouTube({ title, content, media_url });
          break;
        case 'instagram':
          result = await postToInstagram({ content, media_url });
          break;
        case 'twitter':
          result = await postToTwitter({ content, media_url });
          break;
        default:
          return NextResponse.json(
            { error: 'Unknown platform' },
            { status: 400 }
          );
      }

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      // Save to database
      const { data: savedPost } = await supabase
        .from('social_media_posts')
        .insert({
          platform,
          title,
          content,
          media_url,
          posted_at: new Date().toISOString(),
          status: 'posted',
          platform_post_id: result.post_id,
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        message: 'Posted successfully',
        post: savedPost,
        platform_url: result.url,
      });
    }
  } catch (error) { 
    return NextResponse.json(
      {
        error: 'Internal server err',
        details: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Post to LinkedIn
 */
async function postToLinkedIn(data: any) {
  try {
    // Get LinkedIn credentials from database
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const { data: settings, error: settingsError } = await supabase
      .from('social_media_settings')
      .select('*')
      .eq('platform', 'linkedin')
      .single();

    if (settingsError || !settings) {
      return {
        success: false,
        error:
          'LinkedIn not connected. Please connect in Settings → Social Media',
      };
    }

    // Check if token is expired
    const expiresAt = new Date(settings.expires_at);
    if (expiresAt < new Date()) {
      return {
        success: false,
        error:
          'LinkedIn token expired. Please reconnect in Settings → Social Media',
      };
    }

    const accessToken = settings.access_token;
    const organizations = settings.organizations || [];

    // Use first organization or get from settings
    const organizationId =
      organizations[0]?.organization?.id || settings.organization_id;

    if (!accessToken || !organizationId) {
      return { success: false, error: 'LinkedIn credentials not configured' };
    }

    // LinkedIn API v2
    const { title, content, media_url } = data;
    const postData: any = {
      author: `urn:li:organization:${organizationId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${title || ''}\n\n${content || ''}`,
          },
          shareMediaCategory: media_url ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    if (media_url) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          originalUrl: media_url,
        },
      ];
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `LinkedIn API error: ${error}` };
    }

    const result = await response.json();
    return {
      success: true,
      post_id: result.id,
      url: `https://www.linkedin.com/feed/update/${result.id}`,
    };
  } catch (error) { 
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Post to Facebook
 */
async function postToFacebook(data: any) {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      return { success: false, error: 'Facebook credentials not configured' };
    }

    const { content, media_url } = data;
    const endpoint = media_url
      ? `https://graph.facebook.com/v18.0/${pageId}/photos`
      : `https://graph.facebook.com/v18.0/${pageId}/feed`;

    const params = new URLSearchParams({
      access_token: accessToken,
      message: content || '',
    });

    if (media_url) {
      params.append('url', media_url);
    }

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: `Facebook API error: ${JSON.stringify(error)}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      post_id: result.id,
      url: `https://www.facebook.com/${pageId}/posts/${result.id}`,
    };
  } catch (error) { 
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Post to YouTube (Community Post)
 */
async function postToYouTube(data: any) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
      return { success: false, error: 'YouTube credentials not configured' };
    }

    // Note: YouTube Community Posts require OAuth 2.0
    // This is a simplified version - full implementation needs OAuth flow

    return {
      success: false,
      error:
        'YouTube posting requires OAuth 2.0 setup. Please configure refresh token.',
    };
  } catch (error) { 
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Post to Instagram (via Facebook Graph API)
 */
async function postToInstagram(data: any) {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !accountId) {
      return { success: false, error: 'Instagram credentials not configured' };
    }

    const { content, media_url } = data;

    if (!media_url) {
      return { success: false, error: 'Instagram requires an image or video' };
    }

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: media_url,
          caption: content || '',
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.json();
      return { success: false, error: `Instagram API error: ${JSON.stringify(error)}` };
    }

    const container = await containerResponse.json();

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      return { success: false, error: `Instagram publish error: ${JSON.stringify(error)}` };
    }

    const result = await publishResponse.json();
    return {
      success: true,
      post_id: result.id,
      url: `https://www.instagram.com/p/${result.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Post to Twitter/X
 */
async function postToTwitter(data: any) {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    if (!bearerToken || !apiKey || !apiSecret || !accessToken || !accessSecret) {
      return { success: false, error: 'Twitter credentials not configured' };
    }

    const { content, media_url } = data;

    // Twitter API v2 requires OAuth 1.0a for posting
    // Using oauth-1.0a library pattern
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const OAuth = require('oauth-1.0a');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');

    const oauth = new OAuth({
      consumer: { key: apiKey, secret: apiSecret },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string: string, key: string) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
      },
    });

    const token = { key: accessToken, secret: accessSecret };

    let mediaId = null;

    // Upload media if provided
    if (media_url) {
      // Download image and upload to Twitter
      const imageResponse = await fetch(media_url);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
      const uploadData = { media_data: base64Image };

      const uploadAuth = oauth.authorize({ url: uploadUrl, method: 'POST' }, token);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...oauth.toHeader(uploadAuth),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(uploadData),
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        mediaId = uploadResult.media_id_string;
      }
    }

    // Post tweet
    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const tweetData: any = { text: content || '' };
    if (mediaId) {
      tweetData.media = { media_ids: [mediaId] };
    }

    const tweetAuth = oauth.authorize({ url: tweetUrl, method: 'POST' }, token);

    const tweetResponse = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        ...oauth.toHeader(tweetAuth),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    if (!tweetResponse.ok) {
      const error = await tweetResponse.json();
      return { success: false, error: `Twitter API error: ${JSON.stringify(error)}` };
    }

    const result = await tweetResponse.json();
    return {
      success: true,
      post_id: result.data.id,
      url: `https://twitter.com/i/web/status/${result.data.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Internal server error',
    };
  }
}

/**
 * GET /api/social-media/post
 * Get scheduled and posted content
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    let query = supabase
      .from('social_media_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to fetch posts',
          details: 'Internal server error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts });
  } catch (error) { 
    return NextResponse.json(
      {
        error: 'Internal server err',
        details: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
