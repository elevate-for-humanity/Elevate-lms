/**
 * Mentor Matching System
 * Connects program graduates with current students
 */

import { createClient } from '@/lib/supabase/server';

export interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  program_completed: string;
  completion_date: string;
  current_employer?: string;
  current_job_title?: string;
  bio?: string;
  availability: string[];
  mentees_count: number;
  rating?: number;
  is_available: boolean;
}

export interface MentorMatch {
  mentor: Mentor;
  match_score: number;
  match_reasons: string[];
}

export interface MentorshipRequest {
  id: string;
  mentee_id: string;
  mentor_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  message?: string;
  created_at: string;
}

/**
 * Get available mentors for a student
 */
export async function getMentorMatches(userId: string, limit = 10): Promise<MentorMatch[]> {
  const supabase = await createClient();

  // Get student's current program
  const { data: studentEnrollment } = await supabase
    .from('enrollments')
    .select('program_id, programs(name, slug)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!studentEnrollment) return [];

  const programId = studentEnrollment.program_id;
  const programName = (studentEnrollment.programs as any)?.name;

  // Find graduates from the same program who opted to be mentors
  const { data: mentors } = await supabase
    .from('mentors')
    .select(`
      id,
      user_id,
      bio,
      availability,
      is_available,
      profiles!mentors_user_id_fkey(full_name, avatar_url),
      enrollments!inner(program_id, status, completed_at, programs(name))
    `)
    .eq('is_available', true)
    .eq('enrollments.program_id', programId)
    .eq('enrollments.status', 'completed')
    .limit(20);

  if (!mentors) return [];

  // Get job placements for mentors
  const mentorUserIds = mentors.map(m => m.user_id);
  const { data: placements } = await supabase
    .from('job_placements')
    .select('user_id, employer_name, job_title')
    .in('user_id', mentorUserIds)
    .eq('status', 'hired');

  const placementMap = new Map(placements?.map(p => [p.user_id, p]) || []);

  // Get mentee counts
  const { data: menteeCounts } = await supabase
    .from('mentorships')
    .select('mentor_id')
    .in('mentor_id', mentors.map(m => m.id))
    .eq('status', 'active');

  const menteeCountMap = new Map<string, number>();
  menteeCounts?.forEach(m => {
    menteeCountMap.set(m.mentor_id, (menteeCountMap.get(m.mentor_id) || 0) + 1);
  });

  // Build matches
  const matches: MentorMatch[] = [];

  for (const mentor of mentors) {
    const profile = mentor.profiles as any;
    const enrollment = (mentor.enrollments as any)?.[0];
    const placement = placementMap.get(mentor.user_id);
    
    let score = 50; // Base score for same program
    const reasons: string[] = [`Completed ${programName}`];

    // Boost if employed
    if (placement) {
      score += 20;
      reasons.push(`Working as ${placement.job_title}`);
    }

    // Boost if has availability
    if (mentor.availability && mentor.availability.length > 0) {
      score += 10;
    }

    // Reduce score if has many mentees already
    const menteeCount = menteeCountMap.get(mentor.id) || 0;
    if (menteeCount >= 3) {
      score -= 20;
    }

    matches.push({
      mentor: {
        id: mentor.id,
        user_id: mentor.user_id,
        full_name: profile?.full_name || 'Mentor',
        avatar_url: profile?.avatar_url,
        program_completed: enrollment?.programs?.name || programName,
        completion_date: enrollment?.completed_at,
        current_employer: placement?.employer_name,
        current_job_title: placement?.job_title,
        bio: mentor.bio,
        availability: mentor.availability || [],
        mentees_count: menteeCount,
        is_available: mentor.is_available,
      },
      match_score: Math.max(0, Math.min(100, score)),
      match_reasons: reasons,
    });
  }

  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}

/**
 * Request a mentor
 */
export async function requestMentor(
  menteeId: string, 
  mentorId: string, 
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if already has active mentorship with this mentor
  const { data: existing } = await supabase
    .from('mentorships')
    .select('id')
    .eq('mentee_id', menteeId)
    .eq('mentor_id', mentorId)
    .in('status', ['pending', 'active'])
    .single();

  if (existing) {
    return { success: false, error: 'Already have a pending or active mentorship' };
  }

  // Create request
  const { error } = await supabase
    .from('mentorships')
    .insert({
      mentee_id: menteeId,
      mentor_id: mentorId,
      message,
      status: 'pending',
    });

  if (error) {
    return { success: false, error: 'Operation failed' };
  }

  // Notify mentor
  await supabase
    .from('notifications')
    .insert({
      user_id: mentorId,
      type: 'info',
      title: 'New Mentorship Request',
      message: 'A student has requested you as their mentor',
      action_url: '/hub/mentorship',
      action_label: 'View Request',
    });

  return { success: true };
}

/**
 * Accept/decline mentorship request
 */
export async function respondToMentorshipRequest(
  mentorId: string,
  requestId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: request } = await supabase
    .from('mentorships')
    .select('mentee_id')
    .eq('id', requestId)
    .eq('mentor_id', mentorId)
    .single();

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  const { error } = await supabase
    .from('mentorships')
    .update({
      status: accept ? 'active' : 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    return { success: false, error: 'Operation failed' };
  }

  // Notify mentee
  await supabase
    .from('notifications')
    .insert({
      user_id: request.mentee_id,
      type: accept ? 'success' : 'info',
      title: accept ? 'Mentorship Accepted!' : 'Mentorship Update',
      message: accept 
        ? 'Your mentor request has been accepted. You can now connect!'
        : 'Your mentor request was declined. Try connecting with another mentor.',
      action_url: '/hub/mentorship',
    });

  return { success: true };
}

/**
 * Get user's mentors and mentees
 */
export async function getUserMentorships(userId: string): Promise<{
  mentors: any[];
  mentees: any[];
}> {
  const supabase = await createClient();

  // Get as mentee (my mentors)
  const { data: myMentors } = await supabase
    .from('mentorships')
    .select(`
      id,
      status,
      created_at,
      mentor:mentors(
        id,
        user_id,
        bio,
        profiles!mentors_user_id_fkey(full_name, avatar_url)
      )
    `)
    .eq('mentee_id', userId)
    .eq('status', 'active');

  // Get as mentor (my mentees)
  const { data: mentor } = await supabase
    .from('mentors')
    .select('id')
    .eq('user_id', userId)
    .single();

  let myMentees: any[] = [];
  if (mentor) {
    const { data } = await supabase
      .from('mentorships')
      .select(`
        id,
        status,
        created_at,
        mentee_id,
        profiles!mentorships_mentee_id_fkey(full_name, avatar_url)
      `)
      .eq('mentor_id', mentor.id)
      .eq('status', 'active');
    myMentees = data || [];
  }

  return {
    mentors: myMentors || [],
    mentees: myMentees,
  };
}

/**
 * Register as a mentor (for graduates)
 */
export async function registerAsMentor(
  userId: string,
  bio: string,
  availability: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user has completed a program
  const { data: completion } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .limit(1)
    .single();

  if (!completion) {
    return { success: false, error: 'Must complete a program to become a mentor' };
  }

  // Create or update mentor profile
  const { error } = await supabase
    .from('mentors')
    .upsert({
      user_id: userId,
      bio,
      availability,
      is_available: true,
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    return { success: false, error: 'Operation failed' };
  }

  return { success: true };
}
