
// Bulk operations for admin functions

import { createClient } from '@/lib/supabase/server';
import { auditLog } from './auditLog';

export async function bulkEnrollStudents(
  studentIds: string[],
  courseId: string,
  actorId: string
) {
  const supabase = await createClient();

  try {
    const enrollments = studentIds.map((studentId) => ({
      student_id: studentId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: 'active',
    }));

    const { data, error }: any = await supabase
      .from('program_enrollments')
      .insert(enrollments)
      .select();

    if (error) {
      return { success: false, error: 'Operation failed' };
    }

    // Log audit event
    await auditLog({
      action: 'enrollment.create',
      actor_id: actorId,
      target_type: 'course',
      target_id: courseId,
      metadata: { student_count: studentIds.length },
    });

    return {
      success: true,
      enrolled: data?.length || 0,
      data,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function bulkUnenrollStudents(
  studentIds: string[],
  courseId: string,
  actorId: string
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('program_enrollments')
      .delete()
      .in('student_id', studentIds)
      .eq('course_id', courseId);

    if (error) {
      return { success: false, error: 'Operation failed' };
    }

    await auditLog({
      action: 'enrollment.delete',
      actor_id: actorId,
      target_type: 'course',
      target_id: courseId,
      metadata: { student_count: studentIds.length },
    });

    return {
      success: true,
      unenrolled: studentIds.length,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function bulkIssueCertificates(
  studentIds: string[],
  courseId: string,
  actorId: string
) {
  const supabase = await createClient();

  try {
    // Get course details
    const { data: course } = await supabase
      .from('training_courses')
      .select('title, program_name')
      .eq('id', courseId)
      .single();

    if (!course) {
      return { success: false, error: 'Course not found' };
    }

    // Get student details
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds);

    if (!students) {
      return { success: false, error: 'Students not found' };
    }

    const certificates = students.map((student) => ({
      student_id: student.id,
      student_name: student.full_name,
      course_id: courseId,
      course_title: course.title,
      program_name: course.program_name,
      certificate_number: `CERT-${Date.now()}-${student.id.slice(0, 8)}`,
      issued_date: new Date().toISOString(),
      verification_code: Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase(),
    }));

    const { data, error }: any = await supabase
      .from('certificates')
      .insert(certificates)
      .select();

    if (error) {
      return { success: false, error: 'Operation failed' };
    }

    await auditLog({
      action: 'certificate.issue',
      actor_id: actorId,
      target_type: 'course',
      target_id: courseId,
      metadata: { certificate_count: studentIds.length },
    });

    return {
      success: true,
      issued: data?.length || 0,
      data,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function bulkUpdateGrades(
  updates: Array<{ student_id: string; assignment_id: string; grade: number }>,
  actorId: string
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
      })
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    await auditLog({
      action: 'grade.update',
      actor_id: actorId,
      metadata: {
        total: updates.length,
        successful,
        failed,
      },
    });

    return {
      success: failed === 0,
      successful,
      failed,
      results,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function bulkDeleteUsers(userIds: string[], actorId: string) {
  const supabase = await createClient();

  try {
    // Delete related data first
    await Promise.all([
      supabase.from('program_enrollments').delete().in('student_id', userIds),
      supabase.from('certificates').delete().in('student_id', userIds),
      supabase.from('assignments').delete().in('student_id', userIds),
      supabase.from('grades').delete().in('student_id', userIds),
      supabase.from('notes').delete().in('user_id', userIds),
    ]);

    // Delete profiles
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIds);

    if (error) {
      return { success: false, error: 'Operation failed' };
    }

    await auditLog({
      action: 'user.delete',
      actor_id: actorId,
      metadata: { user_count: userIds.length },
    });

    return {
      success: true,
      deleted: userIds.length,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
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
  actorId: string
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

    const { data, error }: any = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (error) {
      return { success: false, error: 'Operation failed' };
    }

    return {
      success: true,
      sent: data?.length || 0,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

export async function bulkExportData(
  table: string,
  filters?: Record<string, any>
) {
  const supabase = await createClient();

  try {
    let query = supabase.from(table).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: 'Operation failed' };
    }

    // Convert to CSV
    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              const stringValue = value === null ? '' : String(value);
              return `"${stringValue.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\n');

      return {
        success: true,
        data: csv,
        filename: `${table}_export_${Date.now()}.csv`,
        recordCount: data.length,
      };
    }

    return {
      success: true,
      data: '',
      filename: `${table}_export_${Date.now()}.csv`,
      recordCount: 0,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}
