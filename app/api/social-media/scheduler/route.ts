
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Social Media Scheduler - Posts to social platforms 3x daily
 * Run via cron at 9 AM, 1 PM, and 5 PM EST
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // Get current hour in configured timezone
    const now = new Date();
    const tz = process.env.SOCIAL_MEDIA_TIMEZONE || 'America/New_York';
    const estHour = new Date(
      now.toLocaleString('en-US', { timeZone: tz })
    ).getHours();

    // Determine which posting slot (0 = morning, 1 = afternoon, 2 = evening)
    let slot = 0;
    if (estHour >= 13 && estHour < 17) slot = 1;
    else if (estHour >= 17) slot = 2;

    // Get active campaigns
    const { data: campaigns, error } = await supabase
      .from('social_media_campaigns')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active campaigns',
        posted: 0,
      });
    }

    const results = [];

    for (const campaign of campaigns) {
      try {
        // Calculate which post to send based on days elapsed
        const startDate = new Date(campaign.created_at);
        const daysElapsed = Math.floor(
          (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if campaign is still within duration
        if (daysElapsed >= campaign.duration_days) {
          // Campaign completed, mark as finished
          await supabase
            .from('social_media_campaigns')
            .update({ status: 'completed' })
            .eq('id', campaign.id);

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            status: 'completed',
          });
          continue;
        }

        // Calculate post index (3 posts per day)
        const postIndex = daysElapsed * 3 + slot;

        if (postIndex >= campaign.posts.length) {
          continue; // No more posts
        }

        const postContent = campaign.posts[postIndex];

        // Post to each platform
        for (const platform of campaign.platforms) {
          try {
            await postToSocialMedia(platform, postContent, campaign);

            // Log the post
            await supabase.from('social_media_posts').insert({
              campaign_id: campaign.id,
              platform,
              content: postContent,
              post_index: postIndex,
              posted_at: now.toISOString(),
              status: 'posted',
            });

            results.push({
              campaignId: campaign.id,
              name: campaign.name,
              platform,
              postIndex,
              success: true,
            });
          } catch (error) { /* Error handled silently */ 
            logger.error(
              `Error posting to ${platform}:`,
              error instanceof Error ? error : new Error(String(error))
            );

            // Log failure
            await supabase.from('social_media_posts').insert({
              campaign_id: campaign.id,
              platform,
              content: postContent,
              post_index: postIndex,
              status: 'failed',
              error_message: toErrorMessage(error),
            });

            results.push({
              campaignId: campaign.id,
              name: campaign.name,
              platform,
              postIndex,
              success: false,
              error: toErrorMessage(error),
            });
          }
        }

        // Update campaign last_post_at
        await supabase
          .from('social_media_campaigns')
          .update({ last_post_at: now.toISOString() })
          .eq('id', campaign.id);
      } catch (error) { /* Error handled silently */ 
        logger.error(
          `Error processing campaign ${campaign.id}:`,
          error instanceof Error ? error : new Error(String(error))
        );
        results.push({
          campaignId: campaign.id,
          name: campaign.name,
          success: false,
          error: toErrorMessage(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Posted ${results.filter((r) => r.success).length} times`,
      slot: ['morning', 'afternoon', 'evening'][slot],
      results,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Scheduler error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { success: false, error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

/**
 * Post to social media platform
 */
async function postToSocialMedia(
  platform: string,
  content: string,
  campaign: Record<string, any>
) {
  logger.info(`Posting to ${platform}:`, content);

  switch (platform.toLowerCase()) {
    case 'facebook':
      return await postToFacebook(content, campaign);

    case 'x':
    // fallthrough intentional

    case 'linkedin':
      return await postToLinkedIn(content, campaign);

    case 'instagram':
      return await postToInstagram(content, campaign);

    default:
      logger.warn(`Unknown platform: ${platform}`);
      return { success: false, error: 'Unknown platform' };
  }
}

async function postToFacebook(
  content: string,
  campaign: Record<string, any>
) {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    logger.warn('Facebook credentials not configured');
    return { success: false, error: 'Facebook not configured' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Facebook API error');
    }

    return { success: true, platform: 'facebook', postId: data.id };
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Facebook posting error:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

async function postToLinkedIn(
  content: string,
  campaign: Record<string, any>
) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const organizationId = process.env.LINKEDIN_ORGANIZATION_ID;

  if (!accessToken || !organizationId) {
    logger.warn('LinkedIn credentials not configured');
    return { success: false, error: 'LinkedIn not configured' };
  }

  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:organization:${organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'LinkedIn API error');
    }

    return { success: true, platform: 'linkedin', postId: data.id };
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'LinkedIn posting error:',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

async function postToInstagram(
  content: string,
  campaign: Record<string, any>
) {
  // Instagram requires media (image/video) for posts
  // Text-only posts are not supported
  logger.warn(
    'Instagram requires media content - text-only posts not supported'
  );
  return { success: false, error: 'Instagram requires media content' };
}

/**
 * Manual trigger for testing
 */
export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  return GET(req);
}
