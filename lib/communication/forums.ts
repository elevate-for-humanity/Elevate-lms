/**
 * Discussion Forums System
 * Threaded discussions with moderation tools
 */

import { createClient } from '@/lib/supabase/server';

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  scope: 'system' | 'site' | 'program' | 'course';
  scope_id?: string;
  order: number;
  active: boolean;
  created_at: string;
}

export interface ForumThread {
  id: string;
  category_id: string;
  title: string;
  author_id: string;
  pinned: boolean;
  locked: boolean;
  view_count: number;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  parent_post_id?: string; // For threaded replies
  content: string;
  edited: boolean;
  edited_at?: string;
  flagged: boolean;
  flag_reason?: string;
  moderated: boolean;
  moderation_action?: 'approved' | 'hidden' | 'deleted';
  moderator_id?: string;
  moderation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ForumSubscription {
  id: string;
  user_id: string;
  thread_id: string;
  notify_email: boolean;
  notify_sms: boolean;
  created_at: string;
}

/**
 * Create forum category
 */
export async function createForumCategory(data: {
  name: string;
  description: string;
  scope: 'system' | 'site' | 'program' | 'course';
  scope_id?: string;
  order?: number;
}): Promise<ForumCategory> {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('forum_categories')
    .insert({
      ...data,
      order: data.order || 0,
      active: true,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return category;
}

/**
 * Get forum categories
 */
export async function getForumCategories(filters?: {
  scope?: string;
  scope_id?: string;
}): Promise<ForumCategory[]> {
  const supabase = await createClient();

  let query = supabase
    .from('forum_categories')
    .select('*')
    .eq('active', true)
    .order('order', { ascending: true });

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.scope_id) {
    query = query.eq('scope_id', filters.scope_id);
  }

  const { data } = await query;
  return data || [];
}

/**
 * Create forum thread
 */
export async function createForumThread(data: {
  category_id: string;
  title: string;
  author_id: string;
  initial_post_content: string;
}): Promise<{ thread: ForumThread; post: ForumPost }> {
  const supabase = await createClient();

  // Create thread
  const { data: thread, error: threadError } = await supabase
    .from('forum_threads')
    .insert({
      category_id: data.category_id,
      title: data.title,
      author_id: data.author_id,
      pinned: false,
      locked: false,
      view_count: 0,
      reply_count: 0,
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (threadError) throw threadError;

  // Create initial post
  const { data: post, error: postError } = await supabase
    .from('forum_posts')
    .insert({
      thread_id: thread.id,
      author_id: data.author_id,
      content: data.initial_post_content,
      edited: false,
      flagged: false,
      moderated: false,
    })
    .select()
    .maybeSingle();

  if (postError) throw postError;

  // Auto-subscribe author to thread
  await subscribeToThread(thread.id, data.author_id);

  return { thread, post };
}

/**
 * Get threads in category
 */
export async function getCategoryThreads(
  category_id: string,
  options?: {
    pinned_only?: boolean;
    limit?: number;
    offset?: number;
  },
): Promise<ForumThread[]> {
  const supabase = await createClient();

  let query = supabase
    .from('forum_threads')
    .select('*, profiles(full_name, avatar_url)')
    .eq('category_id', category_id)
    .order('pinned', { ascending: false })
    .order('last_activity_at', { ascending: false });

  if (options?.pinned_only) {
    query = query.eq('pinned', true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data } = await query;
  return data || [];
}

/**
 * Get thread with posts
 */
export async function getThreadWithPosts(thread_id: string): Promise<{
  thread: ForumThread;
  posts: ForumPost[];
}> {
  const supabase = await createClient();

  // Get thread
  const { data: thread } = await supabase
    .from('forum_threads')
    .select('*, profiles(full_name, avatar_url)')
    .eq('id', thread_id)
    .maybeSingle();

  if (!thread) {
    throw new Error('Thread not found');
  }

  // Increment view count
  await supabase
    .from('forum_threads')
    .update({ view_count: thread.view_count + 1 })
    .eq('id', thread_id);

  // Get posts
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name, avatar_url)')
    .eq('thread_id', thread_id)
    .eq('moderation_action', null)
    .order('created_at', { ascending: true });

  return {
    thread,
    posts: posts || [],
  };
}

/**
 * Create forum post (reply)
 */
export async function createForumPost(data: {
  thread_id: string;
  author_id: string;
  content: string;
  parent_post_id?: string;
}): Promise<ForumPost> {
  const supabase = await createClient();

  // Check if thread is locked
  const { data: thread } = await supabase
    .from('forum_threads')
    .select('locked')
    .eq('id', data.thread_id)
    .maybeSingle();

  if (thread?.locked) {
    throw new Error('Thread is locked');
  }

  // Create post
  const { data: post, error } = await supabase
    .from('forum_posts')
    .insert({
      ...data,
      edited: false,
      flagged: false,
      moderated: false,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  // Update thread reply count and last activity
  await supabase
    .from('forum_threads')
    .update({
      reply_count: thread.reply_count + 1,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', data.thread_id);

  // Notify subscribers
  await notifyThreadSubscribers(data.thread_id, post);

  return post;
}

/**
 * Edit forum post
 */
export async function editForumPost(
  post_id: string,
  author_id: string,
  content: string,
): Promise<ForumPost> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('forum_posts')
    .update({
      content,
      edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', post_id)
    .eq('author_id', author_id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return post;
}

/**
 * Delete forum post
 */
export async function deleteForumPost(post_id: string, author_id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', post_id)
    .eq('author_id', author_id);

  if (error) throw error;
}

/**
 * Flag post for moderation
 */
export async function flagPost(post_id: string, user_id: string, reason: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('forum_posts')
    .update({
      flagged: true,
      flag_reason: reason,
    })
    .eq('id', post_id);

  // Create moderation queue entry
  await supabase.from('moderation_queue').insert({
    post_id,
    flagged_by: user_id,
    reason,
    status: 'pending',
  });
}

/**
 * Moderate post (moderator action)
 */
export async function moderatePost(
  post_id: string,
  moderator_id: string,
  action: 'approved' | 'hidden' | 'deleted',
  notes?: string,
): Promise<ForumPost> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('forum_posts')
    .update({
      moderated: true,
      moderation_action: action,
      moderator_id,
      moderation_notes: notes,
    })
    .eq('id', post_id)
    .select()
    .maybeSingle();

  if (error) throw error;

  // Update moderation queue
  await supabase
    .from('moderation_queue')
    .update({
      status: 'resolved',
      resolved_by: moderator_id,
      resolution: action,
      resolved_at: new Date().toISOString(),
    })
    .eq('post_id', post_id);

  return post;
}

/**
 * Pin/unpin thread
 */
export async function toggleThreadPin(
  thread_id: string,
  moderator_id: string,
): Promise<ForumThread> {
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('pinned')
    .eq('id', thread_id)
    .maybeSingle();

  const { data: updated, error } = await supabase
    .from('forum_threads')
    .update({ pinned: !thread?.pinned })
    .eq('id', thread_id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Lock/unlock thread
 */
export async function toggleThreadLock(
  thread_id: string,
  moderator_id: string,
): Promise<ForumThread> {
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('locked')
    .eq('id', thread_id)
    .maybeSingle();

  const { data: updated, error } = await supabase
    .from('forum_threads')
    .update({ locked: !thread?.locked })
    .eq('id', thread_id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Subscribe to thread
 */
export async function subscribeToThread(
  thread_id: string,
  user_id: string,
  notify_email: boolean = true,
  notify_sms: boolean = false,
): Promise<ForumSubscription> {
  const supabase = await createClient();

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('forum_subscriptions')
    .select('*')
    .eq('thread_id', thread_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: subscription, error } = await supabase
    .from('forum_subscriptions')
    .insert({
      thread_id,
      user_id,
      notify_email,
      notify_sms,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return subscription;
}

/**
 * Unsubscribe from thread
 */
export async function unsubscribeFromThread(thread_id: string, user_id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('forum_subscriptions')
    .delete()
    .eq('thread_id', thread_id)
    .eq('user_id', user_id);

  if (error) throw error;
}

/**
 * Get user's subscribed threads
 */
export async function getUserSubscriptions(user_id: string): Promise<ForumThread[]> {
  const supabase = await createClient();

  const { data }: any = await supabase
    .from('forum_subscriptions')
    .select('*, forum_threads(*)')
    .eq('user_id', user_id)
    .order('forum_threads.last_activity_at', { ascending: false });

  return data?.map((s) => s.forum_threads).filter(Boolean) || [];
}

/**
 * Notify thread subscribers of new post
 */
async function notifyThreadSubscribers(thread_id: string, post: ForumPost): Promise<void> {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from('forum_subscriptions')
    .select('*, profiles(email, phone)')
    .eq('thread_id', thread_id)
    .neq('user_id', post.author_id); // Don't notify the author

  if (!subscriptions) return;

  // Send email notifications
  const emailSubscribers = subscriptions.filter((s) => s.notify_email);
  if (emailSubscribers.length > 0) {
    // Email notifications handled by email service
    // Implementation in lib/email/
  }
}

/**
 * Search forums
 */
export async function searchForums(
  query: string,
  filters?: {
    category_id?: string;
    author_id?: string;
  },
): Promise<{ threads: ForumThread[]; posts: ForumPost[] }> {
  const supabase = await createClient();

  // Search threads
  let threadQuery = supabase.from('forum_threads').select('*').ilike('title', `%${query}%`);

  if (filters?.category_id) {
    threadQuery = threadQuery.eq('category_id', filters.category_id);
  }

  if (filters?.author_id) {
    threadQuery = threadQuery.eq('author_id', filters.author_id);
  }

  const { data: threads } = await threadQuery.limit(20);

  // Search posts
  let postQuery = supabase
    .from('forum_posts')
    .select('*, forum_threads(title)')
    .ilike('content', `%${query}%`)
    .eq('moderation_action', null);

  if (filters?.author_id) {
    postQuery = postQuery.eq('author_id', filters.author_id);
  }

  const { data: posts } = await postQuery.limit(20);

  return {
    threads: threads || [],
    posts: posts || [],
  };
}

/**
 * Get moderation queue
 */
export async function getModerationQueue(): Promise<any[]> {
  const supabase = await createClient();

  const { data }: any = await supabase
    .from('moderation_queue')
    .select(
      `
      *,
      forum_posts(*),
      profiles!flagged_by(full_name)
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return data || [];
}
