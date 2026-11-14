'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { publishingReadinessError } from '@/lib/social/publishing-readiness';

function fail(message: string): never {
  redirect(`/social-media?error=${encodeURIComponent(message)}`);
}

export async function enableApprovedPublishing(form: FormData) {
  await requireRole(['admin', 'super_admin']);
  const platform = String(form.get('platform') || '');
  const db = await requireAdminClient();
  const { data: account, error } = await db
    .from('social_media_settings')
    .select('enabled,connection_status,organization_id,expires_at,granted_scopes,updated_at')
    .eq('platform', platform)
    .single();
  if (error) fail('Unable to read the publishing account.');
  const readinessError = publishingReadinessError(platform, account);
  if (readinessError) fail(readinessError);
  const { data: updated, error: updateError } = await db
    .from('social_media_settings')
    .update({ dry_run: false, updated_at: new Date().toISOString() })
    .eq('platform', platform)
    .eq('updated_at', account.updated_at)
    .select('platform');
  if (updateError || !updated?.length) fail('The account changed. Refresh and try again.');
  revalidatePath('/social-media');
  revalidatePath('/settings/social-media');
}

export async function approveSocialPost(form: FormData) {
  const { user } = await requireRole(['admin', 'super_admin']);
  const id = String(form.get('id') || '');
  const expectedUpdatedAt = String(form.get('updated_at') || '');
  const caption = String(form.get('caption') || '').trim();
  if (!caption || caption.length > 2200) fail('Enter a caption between 1 and 2,200 characters.');
  const db = await requireAdminClient();
  const { data: post, error } = await db
    .from('social_media_posts')
    .select('id,platform,destination_type,source_id,updated_at,media_url,thumbnail_url,video_url')
    .eq('id', id)
    .in('status', ['draft', 'pending_approval', 'configuration_required'])
    .single();
  if (error || !post) fail('This post is not available for approval.');
  if (!expectedUpdatedAt || post.updated_at !== expectedUpdatedAt)
    fail('The post changed. Refresh and review it again.');
  if (!['facebook_page', 'instagram_image', 'instagram_reel'].includes(post.destination_type)) {
    fail('This destination is not connected to an automatic publisher.');
  }
  if (post.destination_type === 'instagram_image' && !(post.media_url || post.thumbnail_url)) {
    fail('Add an approved image before queuing this Instagram post.');
  }
  if (post.destination_type === 'instagram_reel' && !post.video_url) {
    fail('Add a finished video before queuing this Reel.');
  }
  const { data: account } = await db
    .from('social_media_settings')
    .select('enabled,connection_status,organization_id,expires_at,granted_scopes,dry_run')
    .eq('platform', post.platform)
    .single();
  const readinessError = publishingReadinessError(post.platform, account);
  if (readinessError) fail(readinessError);
  if (account.dry_run !== false) fail('Enable approved publishing for this account first.');
  const { data: blog } = await db
    .from('blog_posts')
    .select('id')
    .eq('id', post.source_id)
    .eq('published', true)
    .eq('share_to_social', true)
    .single();
  if (!blog) fail('The source article must be published and enabled for social sharing.');
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from('social_media_posts')
    .update({
      caption,
      content: caption,
      approval_state: 'approved',
      approved_by: user.id,
      approved_at: now,
      scheduled_at: now,
      next_attempt_at: null,
      status: 'queued',
      updated_at: now,
      error_message: null,
      last_error_code: null,
    })
    .eq('id', id)
    .eq('updated_at', post.updated_at)
    .in('status', ['draft', 'pending_approval', 'configuration_required'])
    .select('id');
  if (updateError || !updated?.length) fail('The post changed. Review it again before approval.');
  revalidatePath('/social-media');
}
