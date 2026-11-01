import 'server-only';

/**
 * PARIS Marketing Studio - Social Publisher
 * Publish content to multiple social media platforms
 */

import { requireAdminClient } from '@/lib/supabase/admin';
import { publishFacebookPageLink, publishFacebookPageReel, publishInstagramImage, publishInstagramReel } from '@/lib/social/blog-social-pipeline';
import type { GeneratedContent, ScheduledPost, PostMetrics, SocialPlatform, CalendarEntry } from '@/lib/paris/marketing/types';

/**
 * Publish content to a platform
 */
export async function publishContent(
  content: GeneratedContent,
  platform: SocialPlatform,
  options?: {
    scheduledFor?: string;
    mediaUrls?: string[];
    orgId?: string;
  }
): Promise<{
  success: boolean;
  postId?: string;
  publishedUrl?: string;
  error?: string;
}> {

  // Validate content length
  const limits = {
    twitter: 280,
    instagram: 2200,
    linkedin: 3000,
    facebook: 63206,
  };
  
  if (content.text.length > (limits[platform] || 10000)) {
    return { success: false, error: 'Content exceeds platform limit' };
  }

  // If scheduled, save as scheduled post
  if (options?.scheduledFor) {
    return schedulePost(content, platform, options.scheduledFor, options.mediaUrls);
  }

  // Publish immediately
  try {
    const result = await publishNow(content, platform, options?.mediaUrls);
    
    // Log the published post
    await logPublishedPost(content, platform, result);

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish content immediately
 */
async function publishNow(
  content: GeneratedContent,
  platform: SocialPlatform,
  mediaUrls?: string[]
): Promise<{ success: boolean; postId: string; publishedUrl: string }> {
  const message = [content.text, ...content.hashtags].filter(Boolean).join('\n');
  const video = content.media?.find(media => media.type === 'video')?.url;
  let published: { postId: string; publishedUrl: string };
  if (platform === 'facebook') {
    published = video
      ? await publishFacebookPageReel({ description: message, videoUrl: video })
      : await publishFacebookPageLink({ message, link: content.meta?.link || 'https://www.elevateforhumanity.org' });
  } else if (platform === 'instagram') {
    const image = mediaUrls?.[0] || content.media?.find(media => media.type === 'image')?.url;
    if (!video && !image) throw new Error('INSTAGRAM_MEDIA_REQUIRED');
    published = video
      ? await publishInstagramReel({ caption: message, videoUrl: video })
      : await publishInstagramImage({ caption: message, imageUrl: image! });
  } else {
    throw new Error('SOCIAL_PUBLISH_HANDLER_UNAVAILABLE: Connect a supported publishing destination.');
  }
  return { success: true, ...published };
}

/**
 * Schedule content for later
 */
export async function schedulePost(
  content: GeneratedContent,
  platform: SocialPlatform,
  scheduledFor: string,
  mediaUrls?: string[]
): Promise<{
  success: boolean;
  scheduleId?: string;
  error?: string;
}> {
  const scheduleId = crypto.randomUUID();

  // Save to database
  const scheduledPost: ScheduledPost = {
    id: scheduleId,
    contentId: content.id,
    platform,
    scheduledFor,
    status: 'scheduled',
  };

  const supabase = await requireAdminClient();
  const { error } = await supabase.from('scheduled_posts').insert({
    id: scheduleId,
    content_id: content.id,
    platform,
    scheduled_for: scheduledFor,
    status: 'scheduled',
    text: content.text,
    hashtags: content.hashtags,
    media_urls: mediaUrls,
  });
  if (error) throw error;

  return {
    success: true,
    scheduleId,
  };
}

/**
 * Cancel scheduled post
 */
export async function cancelScheduledPost(scheduleId: string): Promise<boolean> {
  const supabase = await requireAdminClient();
  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'archived' })
    .eq('id', scheduleId);

  return !error;
}

/**
 * Get scheduled posts
 */
export async function getScheduledPosts(
  options?: {
    platform?: SocialPlatform;
    from?: string;
    to?: string;
    limit?: number;
  }
): Promise<ScheduledPost[]> {
  const supabase = await requireAdminClient();
  let query = supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled');

  if (options?.platform) {
    query = query.eq('platform', options.platform);
  }

  if (options?.from) {
    query = query.gte('scheduled_for', options.from);
  }

  if (options?.to) {
    query = query.lte('scheduled_for', options.to);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('scheduled_for', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    contentId: row.content_id,
    platform: row.platform,
    scheduledFor: row.scheduled_for,
    status: row.status,
  }));
}

/**
 * Publish to multiple platforms
 */
export async function publishToMultiplePlatforms(
  content: GeneratedContent,
  platforms: SocialPlatform[],
  options?: {
    scheduledFor?: string;
    mediaUrls?: string[];
    orgId?: string;
  }
): Promise<Record<SocialPlatform, { success: boolean; postId?: string; error?: string }>> {
  const results: Record<SocialPlatform, { success: boolean; postId?: string; error?: string }> = {} as any;

  // Publish to all platforms in parallel
  const promises = platforms.map(async (platform) => {
    const result = await publishContent(content, platform, options);
    results[platform] = result;
  });

  await Promise.all(promises);

  return results;
}

/**
 * Get post metrics
 */
export async function getPostMetrics(postId: string, platform: SocialPlatform): Promise<PostMetrics | null> {
  const db = await requireAdminClient();
  const { data, error } = await db.from('published_posts').select('metrics')
    .eq('post_id', postId).eq('platform', platform).maybeSingle();
  if (error) throw error;
  return data?.metrics ?? null;
}

/**
 * Log published post
 */
async function logPublishedPost(
  content: GeneratedContent,
  platform: SocialPlatform,
  result: { success: boolean; postId: string; publishedUrl: string }
): Promise<void> {
  const supabase = await requireAdminClient();
  const { error } = await supabase.from('published_posts').insert({
    content_id: content.id,
    platform,
    post_id: result.postId,
    published_url: result.publishedUrl,
    text: content.text,
    hashtags: content.hashtags,
    status: result.success ? 'published' : 'failed',
    published_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Get content calendar
 */
export async function getContentCalendar(
  options?: {
    from?: string;
    to?: string;
    platform?: SocialPlatform;
    orgId?: string;
  }
): Promise<CalendarEntry[]> {
  const supabase = await requireAdminClient();
  let query = supabase
    .from('content_calendar')
    .select('*');

  if (options?.from) {
    query = query.gte('date', options.from);
  }

  if (options?.to) {
    query = query.lte('date', options.to);
  }

  if (options?.platform) {
    query = query.eq('platform', options.platform);
  }

  const { data, error } = await query.order('date', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    date: row.date,
    platform: row.platform,
    contentId: row.content_id,
    contentType: row.content_type,
    status: row.status,
    notes: row.notes,
  }));
}

/**
 * Add calendar entry
 */
export async function addCalendarEntry(
  entry: Omit<CalendarEntry, 'id'>
): Promise<CalendarEntry> {
  const id = crypto.randomUUID();

  const supabase = await requireAdminClient();
  const { error } = await supabase.from('content_calendar').insert({
    id,
    date: entry.date,
    platform: entry.platform,
    content_id: entry.contentId,
    content_type: entry.contentType,
    status: entry.status,
    notes: entry.notes,
  });
  if (error) throw error;

  return { ...entry, id };
}

/**
 * Get optimal posting times
 */
export function getOptimalPostingTimes(platform: SocialPlatform): string[] {
  const times: Record<SocialPlatform, string[]> = {
    facebook: ['9:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'],
    instagram: ['11:00 AM', '1:00 PM', '7:00 PM', '9:00 PM'],
    linkedin: ['8:00 AM', '10:00 AM', '12:00 PM', '5:00 PM'],
    twitter: ['8:00 AM', '12:00 PM', '5:00 PM', '6:00 PM'],
    tiktok: ['7:00 AM', '12:00 PM', '7:00 PM', '9:00 PM'],
    youtube: ['12:00 PM', '3:00 PM', '6:00 PM', '8:00 PM'],
    pinterest: ['8:00 PM', '11:00 PM', '2:00 AM'],
    threads: ['10:00 AM', '12:00 PM'],
  };

  return times[platform] || times.facebook;
}

/**
 * Suggest posting schedule based on engagement data
 */
export async function suggestPostingSchedule(
  platform: SocialPlatform
): Promise<{ time: string; day: string; expected_engagement?: number }[]> {
  // In production, analyze historical engagement data
  // General timing suggestions; no fabricated engagement scores.

  const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const optimalTimes = getOptimalPostingTimes(platform);

  const suggestions: { time: string; day: string; expected_engagement?: number }[] = [];

  // Suggest best days for each platform
  const bestDays: Record<SocialPlatform, string[]> = {
    facebook: ['Tuesday', 'Wednesday', 'Thursday'],
    instagram: ['Monday', 'Tuesday', 'Wednesday'],
    linkedin: ['Tuesday', 'Wednesday', 'Thursday'],
    twitter: ['Monday', 'Tuesday', 'Wednesday'],
    tiktok: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    youtube: ['Saturday', 'Sunday'],
    pinterest: ['Saturday', 'Sunday'],
    threads: ['Tuesday', 'Wednesday', 'Thursday'],
  };

  const days = bestDays[platform];

  for (const time of optimalTimes.slice(0, 3)) {
    for (const day of days.slice(0, 2)) {
      suggestions.push({
        time,
        day,
      });
    }
  }

  return suggestions.slice(0, 5);
}

/**
 * Bulk schedule content
 */
export async function bulkSchedule(
  contents: GeneratedContent[],
  platforms: SocialPlatform[],
  scheduleStrategy: 'staggered' | 'simultaneous' | 'optimal',
  options?: {
    startDate?: string;
    intervalHours?: number;
  }
): Promise<ScheduledPost[]> {
  const scheduledPosts: ScheduledPost[] = [];
  const startDate = new Date(options?.startDate || Date.now());
  const intervalHours = options?.intervalHours || 4;

  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    
    for (const platform of platforms) {
      let scheduledFor: string;

      if (scheduleStrategy === 'simultaneous') {
        scheduledFor = startDate.toISOString();
      } else if (scheduleStrategy === 'optimal') {
        const suggestions = await suggestPostingSchedule(platform);
        const best = suggestions[0];
        scheduledFor = getNextOccurrence(best.day, best.time);
      } else {
        // Staggered
        const date = new Date(startDate.getTime() + (i * intervalHours * 60 * 60 * 1000));
        scheduledFor = date.toISOString();
      }

      const result = await schedulePost(content, platform, scheduledFor);
      
      if (result.success) {
        scheduledPosts.push({
          id: result.scheduleId!,
          contentId: content.id,
          platform,
          scheduledFor,
          status: 'scheduled',
        });
      }
    }
  }

  return scheduledPosts;
}

/**
 * Get next occurrence of a day/time
 */
function getNextOccurrence(day: string, time: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(day);
  
  const now = new Date();
  const [hours, minutes] = time.replace(/[APM\s]/g, '').split(':').map(Number);
  const hour24 = (hours % 12) + (/PM/i.test(time) ? 12 : 0);
  
  const targetDate = new Date(now);
  const currentDay = now.getDay();
  
  // Find next occurrence of target day
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  
  targetDate.setDate(now.getDate() + daysUntil);
  targetDate.setHours(hour24, minutes || 0, 0, 0);
  
  return targetDate.toISOString();
}
