// PUBLIC ROUTE: public social media feeds
// AUTH: Intentionally public — no authentication required
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * Social Media Feeds API
 * Fetches latest posts from connected social platforms
 * 
 * Platforms:
 * - Facebook (via Graph API)
 * - YouTube (via Data API v3)
 * - LinkedIn (via Marketing API)
 * - Instagram (via Graph API)
 */

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

interface SocialPost {
  id: string;
  platform: 'facebook' | 'youtube' | 'linkedin' | 'instagram';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  url: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: number;
  publishedAt: string;
  url: string;
}

// Fetch Facebook posts
async function fetchFacebookPosts(): Promise<SocialPost[]> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,full_picture,shares,reactions.summary(true),comments.summary(true)&access_token=${accessToken}&limit=5`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data.data || []).map((post: any) => ({
      id: post.id,
      platform: 'facebook' as const,
      content: post.message || '',
      mediaUrl: post.full_picture,
      mediaType: post.full_picture ? 'image' : undefined,
      likes: post.reactions?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
      shares: post.shares?.count || 0,
      timestamp: post.created_time,
      url: `https://facebook.com/${post.id}`,
    }));
  } catch (error) {
    logger.error('Facebook API error:', error);
    return [];
  }
}

// Fetch YouTube videos
async function fetchYouTubeVideos(): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UC_elevateforhumanity';

  if (!apiKey) {
    return [];
  }

  try {
    // Get channel uploads playlist
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    if (!channelResponse.ok) return [];

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) return [];

    // Get videos from uploads playlist
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=6&key=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    if (!videosResponse.ok) return [];

    const videosData = await videosResponse.json();

    // Get video statistics
    const videoIds = videosData.items?.map((item: any) => item.contentDetails.videoId).join(',');
    
    const statsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`,
      { next: { revalidate: 300 } }
    );

    const statsData = await statsResponse.json();
    const statsMap = new Map(statsData.items?.map((item: any) => [item.id, item]) || []);

    return (videosData.items || []).map((item: any) => {
      const videoId = item.contentDetails.videoId;
      const stats = statsMap.get(videoId) as any;
      const duration = stats?.contentDetails?.duration || 'PT0M0S';
      
      // Parse ISO 8601 duration
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match?.[1] || '0');
      const minutes = parseInt(match?.[2] || '0');
      const seconds = parseInt(match?.[3] || '0');
      const formattedDuration = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description?.substring(0, 200) || '',
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        duration: formattedDuration,
        views: parseInt(stats?.statistics?.viewCount || '0'),
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
  } catch (error) {
    logger.error('YouTube API error:', error);
    return [];
  }
}

// Fetch LinkedIn posts
async function fetchLinkedInPosts(): Promise<SocialPost[]> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const companyId = process.env.LINKEDIN_COMPANY_ID;

  if (!accessToken || !companyId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:${companyId})&count=5`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data.elements || []).map((post: any) => ({
      id: post.id,
      platform: 'linkedin' as const,
      content: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
      likes: 0, // Would need separate API call for social actions
      comments: 0,
      shares: 0,
      timestamp: new Date(post.created?.time || Date.now()).toISOString(),
      url: `https://www.linkedin.com/feed/update/${post.id}`,
    }));
  } catch (error) {
    logger.error('LinkedIn API error:', error);
    return [];
  }
}

// Fetch Instagram posts
async function fetchInstagramPosts(): Promise<SocialPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    return [];
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count&access_token=${accessToken}&limit=5`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return (data.data || []).map((post: any) => ({
      id: post.id,
      platform: 'instagram' as const,
      content: post.caption || '',
      mediaUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
      mediaType: post.media_type === 'VIDEO' ? 'video' : 'image',
      likes: post.like_count || 0,
      comments: post.comments_count || 0,
      shares: 0,
      timestamp: post.timestamp,
      url: post.permalink,
    }));
  } catch (error) {
    logger.error('Instagram API error:', error);
    return [];
  }
}

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Fetch from all platforms in parallel
    const [facebookPosts, youtubeVideos, linkedinPosts, instagramPosts] = await Promise.all([
      fetchFacebookPosts(),
      fetchYouTubeVideos(),
      fetchLinkedInPosts(),
      fetchInstagramPosts(),
    ]);

    // Combine and sort by timestamp
    const allPosts = [...facebookPosts, ...linkedinPosts, ...instagramPosts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        posts: allPosts,
        videos: youtubeVideos,
        stats: {
          facebook: facebookPosts.length > 0,
          youtube: youtubeVideos.length > 0,
          linkedin: linkedinPosts.length > 0,
          instagram: instagramPosts.length > 0,
        },
      },
    });
  } catch (error) {
    logger.error('Social feeds error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social feeds' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/social/feeds', _GET);
