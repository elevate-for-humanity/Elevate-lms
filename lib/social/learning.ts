import { logger } from '@/lib/logger';
/**
 * Social Learning Service
 * Enables peer collaboration, discussions, and study groups
 */

import { createClient } from '@/lib/supabase/server';

export interface Discussion {
  id: string;
  title: string;
  content: string;
  authorId: string;
  courseId?: string;
  programId?: string;
  createdAt: string;
  replyCount: number;
  likeCount: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId?: string;
  programId?: string;
  memberCount: number;
  isPublic: boolean;
  createdAt: string;
}

/**
 * Create a new discussion post
 */
export async function createDiscussion(params: {
  title: string;
  content: string;
  authorId: string;
  courseId?: string;
  programId?: string;
  tags?: string[];
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      title: params.title,
      content: params.content,
      author_id: params.authorId,
      course_id: params.courseId,
      program_id: params.programId,
      tags: params.tags || [],
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create discussion:', error);
    return { success: false, error };
  }

  return { success: true, discussion: data };
}

/**
 * Reply to a discussion
 */
export async function replyToDiscussion(params: {
  discussionId: string;
  content: string;
  authorId: string;
  parentReplyId?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('discussion_replies')
    .insert({
      discussion_id: params.discussionId,
      content: params.content,
      author_id: params.authorId,
      parent_reply_id: params.parentReplyId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create reply:', error);
    return { success: false, error };
  }

  // Update reply count
  await supabase.rpc('increment_discussion_replies', {
    p_discussion_id: params.discussionId,
  });

  return { success: true, reply: data };
}

/**
 * Create a study group
 */
export async function createStudyGroup(params: {
  name: string;
  description: string;
  creatorId: string;
  courseId?: string;
  programId?: string;
  isPublic?: boolean;
  maxMembers?: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('study_groups')
    .insert({
      name: params.name,
      description: params.description,
      creator_id: params.creatorId,
      course_id: params.courseId,
      program_id: params.programId,
      is_public: params.isPublic ?? true,
      max_members: params.maxMembers || 20,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create study group:', error);
    return { success: false, error };
  }

  // Add creator as first member
  await supabase.from('study_group_members').insert({
    group_id: data.id,
    user_id: params.creatorId,
    role: 'admin',
    joined_at: new Date().toISOString(),
  });

  return { success: true, group: data };
}

/**
 * Join a study group
 */
export async function joinStudyGroup(groupId: string, userId: string) {
  const supabase = await createClient();

  // Check if already a member
  const { data: existing } = await supabase
    .from('study_group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return { success: false, error: 'Already a member' };
  }

  // Check group capacity
  const { data: group } = await supabase
    .from('study_groups')
    .select('max_members')
    .eq('id', groupId)
    .single();

  const { count } = await supabase
    .from('study_group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (group && count && count >= group.max_members) {
    return { success: false, error: 'Group is full' };
  }

  const { error } = await supabase.from('study_group_members').insert({
    group_id: groupId,
    user_id: userId,
    role: 'member',
    joined_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error };
  }

  return { success: true };
}

/**
 * Get peer recommendations for a user
 */
export async function getPeerRecommendations(userId: string, limit = 5) {
  const supabase = await createClient();

  // Get user's enrolled courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!enrollments?.length) return [];

  const courseIds = enrollments.map(e => e.course_id);

  // Find other users in same courses
  const { data: peers } = await supabase
    .from('enrollments')
    .select(`
      user_id,
      profiles:user_id (full_name, avatar_url)
    `)
    .in('course_id', courseIds)
    .neq('user_id', userId)
    .eq('status', 'active')
    .limit(limit * 2);

  // Deduplicate and limit
  const uniquePeers = new Map();
  peers?.forEach(p => {
    if (!uniquePeers.has(p.user_id)) {
      uniquePeers.set(p.user_id, p);
    }
  });

  return Array.from(uniquePeers.values()).slice(0, limit);
}

/**
 * Get trending discussions
 */
export async function getTrendingDiscussions(limit = 10) {
  const supabase = await createClient();

  const { data } = await supabase
    .from('discussions')
    .select(`
      id,
      title,
      content,
      author_id,
      course_id,
      reply_count,
      like_count,
      created_at,
      profiles:author_id (full_name, avatar_url)
    `)
    .order('reply_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

/**
 * Get active study groups
 */
export async function getActiveStudyGroups(params?: {
  courseId?: string;
  programId?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('study_groups')
    .select(`
      id,
      name,
      description,
      course_id,
      program_id,
      is_public,
      max_members,
      created_at
    `)
    .eq('is_public', true);

  if (params?.courseId) {
    query = query.eq('course_id', params.courseId);
  }

  if (params?.programId) {
    query = query.eq('program_id', params.programId);
  }

  const { data } = await query
    .order('created_at', { ascending: false })
    .limit(params?.limit || 10);

  return data || [];
}
