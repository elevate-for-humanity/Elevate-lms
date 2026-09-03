/**
 * lib/curriculum/skills-verification.ts
 * 
 * Skills Verification for Instructor Sign-off
 * Tracks competency demonstrations and skill mastery
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface SkillVerification {
  id: string;
  enrollmentId: string;
  studentId: string;
  instructorId: string;
  moduleSlug: string;
  checklistItemId: string;
  task: string;
  status: 'pending' | 'in_progress' | 'verified' | 'needs_retry';
  method: 'observation' | 'demonstration' | 'verbal';
  verifiedAt?: string;
  notes?: string;
  score?: number;
}

export interface ModuleSkillsProgress {
  moduleSlug: string;
  moduleTitle: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  percentComplete: number;
  verifications: SkillVerification[];
}

/**
 * Get or create skill verifications for an enrollment
 */
export async function getOrCreateVerifications(
  enrollmentId: string,
  studentId: string,
  instructorId: string,
  moduleSlug: string,
  checklistItems: { id: string; task: string; method: string }[]
): Promise<SkillVerification[]> {
  const supabase = createAdminClient();

  // Check existing verifications
  const { data: existing } = await supabase
    .from('skill_verifications')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('module_slug', moduleSlug);

  if (existing && existing.length > 0) {
    return existing.map(row => ({
      id: row.id,
      enrollmentId: row.enrollment_id,
      studentId: row.student_id,
      instructorId: row.instructor_id,
      moduleSlug: row.module_slug,
      checklistItemId: row.checklist_item_id,
      task: row.task,
      status: row.status,
      method: row.method,
      verifiedAt: row.verified_at,
      notes: row.notes,
      score: row.score,
    }));
  }

  // Create new verifications
  const verifications: SkillVerification[] = checklistItems.map(item => ({
    id: crypto.randomUUID(),
    enrollmentId,
    studentId,
    instructorId,
    moduleSlug,
    checklistItemId: item.id,
    task: item.task,
    status: 'pending' as const,
    method: item.method as 'observation' | 'demonstration' | 'verbal',
  }));

  await supabase.from('skill_verifications').insert(
    verifications.map(v => ({
      id: v.id,
      enrollment_id: v.enrollmentId,
      student_id: v.studentId,
      instructor_id: v.instructorId,
      module_slug: v.moduleSlug,
      checklist_item_id: v.checklistItemId,
      task: v.task,
      status: v.status,
      method: v.method,
    }))
  );

  return verifications;
}

/**
 * Verify a skill (instructor sign-off)
 */
export async function verifySkill(
  verificationId: string,
  instructorId: string,
  status: 'verified' | 'needs_retry',
  score?: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('skill_verifications')
    .update({
      status: status === 'verified' ? 'verified' : 'needs_retry',
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      instructor_id: instructorId,
      score,
      notes,
    })
    .eq('id', verificationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get module skills progress for a student
 */
export async function getModuleSkillsProgress(
  enrollmentId: string,
  moduleSlug: string
): Promise<ModuleSkillsProgress | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('skill_verifications')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('module_slug', moduleSlug);

  if (error || !data || data.length === 0) return null;

  const verifications = data.map(row => ({
    id: row.id,
    enrollmentId: row.enrollment_id,
    studentId: row.student_id,
    instructorId: row.instructor_id,
    moduleSlug: row.module_slug,
    checklistItemId: row.checklist_item_id,
    task: row.task,
    status: row.status,
    method: row.method,
    verifiedAt: row.verified_at,
    notes: row.notes,
    score: row.score,
  }));

  const completedTasks = verifications.filter(v => v.status === 'verified').length;
  const totalTasks = verifications.length;

  return {
    moduleSlug,
    moduleTitle: moduleSlug, // Would be fetched from module data
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    percentComplete: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    verifications,
  };
}

/**
 * Get overall skills progress for enrollment
 */
export async function getEnrollmentSkillsProgress(
  enrollmentId: string
): Promise<{ overall: number; modules: ModuleSkillsProgress[] }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('skill_verifications')
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error || !data) {
    return { overall: 0, modules: [] };
  }

  // Group by module
  const moduleMap = new Map<string, SkillVerification[]>();
  for (const row of data) {
    const existing = moduleMap.get(row.module_slug) || [];
    existing.push({
      id: row.id,
      enrollmentId: row.enrollment_id,
      studentId: row.student_id,
      instructorId: row.instructor_id,
      moduleSlug: row.module_slug,
      checklistItemId: row.checklist_item_id,
      task: row.task,
      status: row.status,
      method: row.method,
      verifiedAt: row.verified_at,
      notes: row.notes,
      score: row.score,
    });
    moduleMap.set(row.module_slug, existing);
  }

  const modules: ModuleSkillsProgress[] = [];
  let totalTasks = 0;
  let completedTasks = 0;

  for (const [slug, verifications] of moduleMap) {
    const completed = verifications.filter(v => v.status === 'verified').length;
    totalTasks += verifications.length;
    completedTasks += completed;

    modules.push({
      moduleSlug: slug,
      moduleTitle: slug,
      totalTasks: verifications.length,
      completedTasks: completed,
      pendingTasks: verifications.length - completed,
      percentComplete: verifications.length > 0 ? Math.round((completed / verifications.length) * 100) : 0,
      verifications,
    });
  }

  return {
    overall: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    modules,
  };
}

/**
 * Check if module skills are complete
 */
export async function areModuleSkillsComplete(
  enrollmentId: string,
  moduleSlug: string
): Promise<boolean> {
  const progress = await getModuleSkillsProgress(enrollmentId, moduleSlug);
  if (!progress) return false;
  return progress.completedTasks === progress.totalTasks;
}

/**
 * Get instructor pending verifications
 */
export async function getInstructorPendingVerifications(
  instructorId: string
): Promise<SkillVerification[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('skill_verifications')
    .select('*, profiles(full_name)')
    .eq('instructor_id', instructorId)
    .in('status', ['pending', 'in_progress', 'needs_retry'])
    .order('verified_at', { ascending: true });

  if (error || !data) return [];

  return data.map(row => ({
    id: row.id,
    enrollmentId: row.enrollment_id,
    studentId: row.student_id,
    instructorId: row.instructor_id,
    moduleSlug: row.module_slug,
    checklistItemId: row.checklist_item_id,
    task: row.task,
    status: row.status,
    method: row.method,
    verifiedAt: row.verified_at,
    notes: row.notes,
    score: row.score,
  }));
}
