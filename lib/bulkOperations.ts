// Bulk operations for admin functions

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { auditLog } from './auditLog';

export async function bulkEnrollStudents(studentIds: string[], courseId: string, actorId: string) {
  const supabase = await createClient();
  try {
    const enrollments = studentIds.map((studentId) => ({
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: 'active',
    }));
    const { data, error }: any = await supabase.from('program_enrollments').insert(enrollments).select();
    if (error) return { success: false, error: 'Operation failed' };

    await auditLog({
      action: 'enrollment.create',
      actor_user_id: actorId,
      entity: 'enrollment',
      entity_id: courseId,
      metadata: { course_id: courseId, student_count: studentIds.length },
    });
    return { success: true, enrolled: data?.length || 0, data };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function bulkUnenrollStudents(studentIds: string[], courseId: string, actorId: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('program_enrollments')
      .delete()
      .in('student_id', studentIds)
      .eq('course_id', courseId);
    if (error) return { success: false, error: 'Operation failed' };

    await auditLog({
      action: 'enrollment.delete',
      actor_user_id: actorId,
      entity: 'enrollment',
      entity_id: courseId,
      metadata: { course_id: courseId, student_count: studentIds.length },
    });
    return { success: true, unenrolled: studentIds.length };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function bulkIssueCertificates(studentIds: string[], courseId: string, actorId: string) {
  const db = await requireAdminClient();
  try {
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id,title,program_id')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError || !course) return { success: false, error: 'Course not found' };

    const { data: students, error: studentError } = await db
      .from('profiles')
      .select('id,full_name,email')
      .in('id', studentIds);
    if (studentError || !students) return { success: false, error: 'Students not found' };

    const { resolveCourseEnrollment } = await import('@/lib/enrollment/resolve-course-enrollment');
    const { checkCourseCompletion } = await import('@/lib/course-completion');
    const { issueCertificate } = await import('@/lib/certificates/issue-certificate');

    const results: Array<{ studentId: string; success: boolean; certificateId?: string; error?: string }> = [];

    for (const student of students) {
      const enrollment = await resolveCourseEnrollment(student.id, courseId);
      if (!enrollment) {
        results.push({ studentId: student.id, success: false, error: 'Learner is not enrolled in this course' });
        continue;
      }

      const completion = await checkCourseCompletion(student.id, courseId);
      if (!completion.isComplete) {
        results.push({
          studentId: student.id,
          success: false,
          error: `Course requirements not met: ${completion.missingRequirements.join('; ')}`,
        });
        continue;
      }

      const issued = await issueCertificate({
        supabase: db,
        enrollmentId: enrollment.id,
        studentId: student.id,
        studentName: student.full_name || student.email || 'Learner',
        studentEmail: student.email || undefined,
        courseId,
        courseTitle: course.title,
        issuedBy: actorId,
        competencyEvidence: {
          seatTimeHours: completion.recordedSeatTimeHours,
          seatTimeSeconds: Math.round(completion.recordedSeatTimeHours * 3600),
          examSessionId: completion.examSession?.id || null,
          examProvider: completion.examSession?.provider || null,
          examResult: completion.examSession?.result || null,
          examScore: completion.examSession?.score || null,
          examProctorId: completion.examSession?.proctor_id || null,
          examDate: completion.examSession?.completed_at || null,
          completionVerifiedAt: new Date().toISOString(),
          completionMethod: 'admin_bulk_after_verified_course_completion',
        },
      });

      if (!issued.success || !issued.certificate) {
        results.push({ studentId: student.id, success: false, error: issued.error || 'Certificate issuance failed' });
        continue;
      }

      results.push({ studentId: student.id, success: true, certificateId: issued.certificate.id });
    }

    const issuedCount = results.filter((result) => result.success).length;
    const failed = results.length - issuedCount;

    await auditLog({
      action: 'certificate.issue',
      actor_user_id: actorId,
      entity: 'certificate',
      entity_id: courseId,
      metadata: { course_id: courseId, requested: studentIds.length, issued: issuedCount, failed },
    });

    return { success: failed === 0, issued: issuedCount, failed, results };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function bulkUpdateGrades(
  updates: Array<{ student_id: string; assignment_id: string; grade: number }>,
  actorId: string,
) {
  const supabase = await createClient();
  try {
    const results = await Promise.all(
      updates.map(async (update) => {
        const { error } = await supabase.from('grades').upsert({
          student_id: update.student_id,
          assignment_id: update.assignment_id,
          grade: update.grade,
          graded_at: new Date().toISOString(),
          graded_by: actorId,
        });
        return { success: !error, error: error?.message };
      }),
    );
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    await auditLog({
      action: 'grade.update',
      actor_user_id: actorId,
      entity: 'enrollment',
      metadata: { total: updates.length, successful, failed, operation: 'bulk_grade_update' },
    });
    return { success: failed === 0, successful, failed, results };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function bulkDeleteUsers(userIds: string[], actorId: string) {
  const supabase = await createClient();
  try {
    await Promise.all([
      supabase.from('program_enrollments').delete().in('student_id', userIds),
      supabase.from('certificates').delete().in('student_id', userIds),
      supabase.from('assignments').delete().in('student_id', userIds),
      supabase.from('grades').delete().in('student_id', userIds),
      supabase.from('notes').delete().in('user_id', userIds),
    ]);
    const { error } = await supabase.from('profiles').delete().in('id', userIds);
    if (error) return { success: false, error: 'Operation failed' };

    await auditLog({
      action: 'user.delete',
      actor_user_id: actorId,
      entity: 'user',
      metadata: { user_count: userIds.length },
    });
    return { success: true, deleted: userIds.length };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function bulkSendNotifications(
  userIds: string[],
  notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action_url?: string;
  },
  actorId: string,
) {
  const supabase = await createClient();
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      action_url: notification.action_url,
      read: false,
      created_at: new Date().toISOString(),
    }));
    const { data, error }: any = await supabase.from('notifications').insert(notifications).select();
    if (error) return { success: false, error: 'Operation failed' };
    return { success: true, sent: data?.length || 0 };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}

export async function bulkExportData(table: string, filters?: Record<string, any>) {
  const supabase = await createClient();
  try {
    let query = supabase.from(table).select('*');
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    const { data, error } = await query;
    if (error) return { success: false, error: 'Operation failed' };

    if (data?.length) {
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => {
            const value = row[header];
            const stringValue = value === null ? '' : String(value);
            return `"${stringValue.replace(/"/g, '""')}"`;
          }).join(','),
        ),
      ].join('\n');
      return { success: true, data: csv, filename: `${table}_export_${Date.now()}.csv`, recordCount: data.length };
    }
    return { success: true, data: '', filename: `${table}_export_${Date.now()}.csv`, recordCount: 0 };
  } catch {
    return { success: false, error: 'Operation failed' };
  }
}
