'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { updateProgramProgress } from '@/lib/lms/update-program-progress';
import { logger } from '@/lib/logger';

const ACCESS_STATES = [
  'active', 'in_progress', 'enrolled', 'confirmed', 'pending_funding_verification',
];

export async function submitAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const assignmentId = formData.get('assignment_id') as string;
  const content = formData.get('content') as string;
  const file = formData.get('file') as File | null;

  if (!assignmentId) return { error: 'Assignment ID is required' };

  const db = await getAdminClient();
  if (!db) return { error: 'Service unavailable' };

  // Verify assignment exists and resolve course_id
  const { data: assignment, error: assignmentError } = await db
    .from('assignments')
    .select('id, course_id, lesson_id')
    .eq('id', assignmentId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return { error: 'Assignment not found' };
  }

  // Resolve course_id — direct or via lesson → module → course
  let courseId: string | null = assignment.course_id ?? null;

  if (!courseId && assignment.lesson_id) {
    const { data: lesson } = await db
      .from('curriculum_lessons')
      .select('module_id')
      .eq('id', assignment.lesson_id)
      .maybeSingle();

    if (lesson?.module_id) {
      const { data: mod } = await db
        .from('course_modules')
        .select('course_id')
        .eq('id', lesson.module_id)
        .maybeSingle();
      courseId = mod?.course_id ?? null;
    }
  }

  if (!courseId) {
    logger.error('submitAssignment: cannot resolve course_id for assignment ' + assignmentId);
    return { error: 'Assignment configuration error' };
  }

  // Verify active enrollment — fail closed
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('id, status, enrollment_state')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  const hasAccess =
    enrollment &&
    (ACCESS_STATES.includes(enrollment.status ?? '') ||
      ACCESS_STATES.includes(enrollment.enrollment_state ?? ''));

  if (!hasAccess) {
    return { error: 'Not enrolled in this course' };
  }

  // Handle file upload via session client (RLS enforces path ownership)
  let submissionUrl: string | null = null;
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${assignmentId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('assignments')
      .upload(fileName, file);

    if (uploadError) {
      return { error: `File upload failed: ${uploadError.message}` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('assignments')
      .getPublicUrl(fileName);

    submissionUrl = publicUrl;
  }

  // Check for existing submission to decide insert vs update
  const { data: existing } = await db
    .from('assignment_submissions')
    .select('id')
    .eq('user_id', user.id)
    .eq('assignment_id', assignmentId)
    .maybeSingle();

  let submitError;

  if (existing) {
    // Update — scoped to this user's own row
    const { error } = await db
      .from('assignment_submissions')
      .update({
        submission_text: content || null,
        submission_url: submissionUrl,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .eq('user_id', user.id); // ownership re-check on write
    submitError = error;
  } else {
    // Insert — user_id set explicitly from verified session
    const { error } = await db
      .from('assignment_submissions')
      .insert({
        user_id: user.id,
        assignment_id: assignmentId,
        submission_text: content || null,
        submission_url: submissionUrl,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      });
    submitError = error;
  }

  if (submitError) {
    logger.error('submitAssignment: write failed', submitError);
    return { error: `Submission failed: ${submitError.message}` };
  }

  // Update durable progress summary — best-effort
  await updateProgramProgress(user.id, courseId);

  revalidatePath('/lms/assignments');
  return { success: true, message: 'Assignment submitted successfully!' };
}
