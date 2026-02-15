/**
 * Job Matching System
 * Auto-matches students/graduates to employer job posts based on:
 * - Completed certifications
 * - Program completion
 * - Skills
 * - Location
 */

import { createClient } from '@/lib/supabase/server';

export interface JobPost {
  id: string;
  employer_id: string;
  employer_name: string;
  employer_logo?: string;
  title: string;
  description: string;
  location: string;
  salary_range?: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  required_certifications: string[];
  required_programs: string[];
  preferred_skills: string[];
  posted_at: string;
  expires_at?: string;
  applicant_count: number;
  is_active: boolean;
}

export interface JobMatch {
  job: JobPost;
  match_score: number; // 0-100
  match_reasons: string[];
  cohort_applicants: number; // How many from user's cohort applied
  cohort_hired: number; // How many from user's cohort got hired here
}

export interface StudentProfile {
  user_id: string;
  completed_programs: string[];
  certifications: string[];
  skills: string[];
  location?: string;
  job_seeking: boolean;
}

/**
 * Get job matches for a student
 */
export async function getJobMatches(userId: string, limit = 10): Promise<JobMatch[]> {
  const supabase = await createClient();

  // Get student's profile and completions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Get completed programs
  const { data: completedEnrollments } = await supabase
    .from('enrollments')
    .select('program_id, programs(name, slug)')
    .eq('user_id', userId)
    .eq('status', 'completed');

  // Get earned certifications
  const { data: certifications } = await supabase
    .from('user_certifications')
    .select('certification_name, certification_type')
    .eq('user_id', userId)
    .eq('status', 'active');

  const completedProgramSlugs = completedEnrollments?.map(e => (e.programs as any)?.slug).filter(Boolean) || [];
  const certNames = certifications?.map(c => c.certification_name) || [];

  // Get active job posts
  const { data: jobs } = await supabase
    .from('job_posts')
    .select(`
      *,
      employers(name, logo_url)
    `)
    .eq('is_active', true)
    .order('posted_at', { ascending: false })
    .limit(50);

  if (!jobs) return [];

  // Score and match jobs
  const matches: JobMatch[] = [];

  for (const job of jobs) {
    const employer = job.employers as any;
    let score = 0;
    const reasons: string[] = [];

    // Check program match
    const requiredPrograms = job.required_programs || [];
    const programMatch = requiredPrograms.some((p: string) => 
      completedProgramSlugs.includes(p.toLowerCase())
    );
    if (programMatch) {
      score += 40;
      reasons.push('Completed required program');
    }

    // Check certification match
    const requiredCerts = job.required_certifications || [];
    const certMatch = requiredCerts.some((c: string) => 
      certNames.some(cert => cert.toLowerCase().includes(c.toLowerCase()))
    );
    if (certMatch) {
      score += 40;
      reasons.push('Has required certification');
    }

    // Location match (if available)
    if (profile?.city && job.location) {
      if (job.location.toLowerCase().includes(profile.city.toLowerCase())) {
        score += 10;
        reasons.push('Location match');
      }
    }

    // Boost if no strict requirements and student has any completion
    if (requiredPrograms.length === 0 && requiredCerts.length === 0 && completedProgramSlugs.length > 0) {
      score += 20;
      reasons.push('Open to program graduates');
    }

    // Get cohort stats for this employer
    const { count: cohortApplicants } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', job.id);

    const { count: cohortHired } = await supabase
      .from('job_placements')
      .select('*', { count: 'exact', head: true })
      .eq('employer_name', employer?.name)
      .eq('status', 'hired');

    if (score > 0 || reasons.length > 0) {
      matches.push({
        job: {
          id: job.id,
          employer_id: job.employer_id,
          employer_name: employer?.name || 'Employer',
          employer_logo: employer?.logo_url,
          title: job.title,
          description: job.description,
          location: job.location,
          salary_range: job.salary_range,
          job_type: job.job_type,
          required_certifications: requiredCerts,
          required_programs: requiredPrograms,
          preferred_skills: job.preferred_skills || [],
          posted_at: job.posted_at,
          expires_at: job.expires_at,
          applicant_count: job.applicant_count || 0,
          is_active: job.is_active,
        },
        match_score: Math.min(score, 100),
        match_reasons: reasons,
        cohort_applicants: cohortApplicants || 0,
        cohort_hired: cohortHired || 0,
      });
    }
  }

  // Sort by match score
  return matches
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, limit);
}

/**
 * Get jobs where cohort members got hired
 */
export async function getCohortSuccessStories(programId: string, limit = 5): Promise<any[]> {
  const supabase = await createClient();

  const { data: placements } = await supabase
    .from('job_placements')
    .select(`
      id,
      user_id,
      employer_name,
      job_title,
      start_date,
      created_at,
      profiles!job_placements_user_id_fkey(full_name, avatar_url)
    `)
    .eq('status', 'hired')
    .order('created_at', { ascending: false })
    .limit(limit);

  return placements || [];
}

/**
 * Apply to a job
 */
export async function applyToJob(userId: string, jobId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if already applied
  const { data: existing } = await supabase
    .from('job_applications')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .single();

  if (existing) {
    return { success: false, error: 'Already applied to this job' };
  }

  // Create application
  const { error } = await supabase
    .from('job_applications')
    .insert({
      user_id: userId,
      job_id: jobId,
      status: 'pending',
    });

  if (error) {
    return { success: false, error: 'Operation failed' };
  }

  // Increment applicant count
  await supabase.rpc('increment_job_applicants', { job_id: jobId });

  return { success: true };
}

/**
 * Get employer's talent pipeline (students matching their needs)
 */
export async function getEmployerTalentPipeline(employerId: string, limit = 20): Promise<any[]> {
  const supabase = await createClient();

  // Get employer's job requirements
  const { data: jobs } = await supabase
    .from('job_posts')
    .select('required_programs, required_certifications')
    .eq('employer_id', employerId)
    .eq('is_active', true);

  if (!jobs || jobs.length === 0) return [];

  // Collect all required programs/certs
  const requiredPrograms = new Set<string>();
  const requiredCerts = new Set<string>();

  for (const job of jobs) {
    (job.required_programs || []).forEach((p: string) => requiredPrograms.add(p));
    (job.required_certifications || []).forEach((c: string) => requiredCerts.add(c));
  }

  // Find matching students
  const { data: candidates } = await supabase
    .from('enrollments')
    .select(`
      user_id,
      progress,
      status,
      profiles!enrollments_user_id_fkey(full_name, avatar_url, email),
      programs(name, slug)
    `)
    .in('status', ['active', 'completed'])
    .gte('progress', 75) // At least 75% complete
    .order('progress', { ascending: false })
    .limit(limit);

  return candidates || [];
}
