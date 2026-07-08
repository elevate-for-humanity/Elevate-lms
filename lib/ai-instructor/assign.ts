import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface AssignInstructorParams {
  studentId: string;
  programSlug: string;
  programId: string;
}

export async function assignAIInstructor({
  studentId,
  programSlug,
  programId,
}: AssignInstructorParams) {
  try {
    const supabase = await createClient();

    // Get program-specific AI instructor
    const { data: instructor, error: instructorError } = await supabase
      .from('ai_instructors')
      .select('id, name, role')
      .eq('program_slug', programSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (instructorError || !instructor) {
      logger.warn('No AI instructor found for program', { programSlug });
      return { success: false, error: 'No instructor found' };
    }

    // Check if already assigned
    const { data: existing } = await supabase
      .from('student_ai_instructors')
      .select('id')
      .eq('student_id', studentId)
      .eq('instructor_id', instructor.id)
      .maybeSingle();

    if (existing) {
      logger.info('AI instructor already assigned', {
        studentId,
        instructorId: instructor.id,
      });
      return {
        success: true,
        assignmentId: existing.id,
        alreadyAssigned: true,
      };
    }

    // Create assignment
    const { data: assignment, error: assignError } = await supabase
      .from('student_ai_instructors')
      .insert({
        student_id: studentId,
        instructor_id: instructor.id,
        program_id: programId,
        is_active: true,
      })
      .select()
      .maybeSingle();

    if (assignError) {
      logger.error('Failed to assign AI instructor', assignError);
      return { success: false, error: assignError.message };
    }

    // Also assign Student Success Coach (universal)
    const { data: successCoach } = await supabase
      .from('ai_instructors')
      .select('id')
      .eq('role', 'Student Success Coach')
      .eq('is_active', true)
      .maybeSingle();

    if (successCoach) {
      await supabase
        .from('student_ai_instructors')
        .insert({
          student_id: studentId,
          instructor_id: successCoach.id,
          program_id: programId,
          is_active: true,
        })
        .select()
        .maybeSingle();
    }

    logger.info('AI instructor assigned successfully', {
      studentId,
      instructorId: instructor.id,
      instructorName: instructor.name,
    });

    return {
      success: true,
      assignmentId: assignment.id,
      instructor: {
        id: instructor.id,
        name: instructor.name,
        role: instructor.role,
      },
    };
  } catch (data: any) {
    logger.data('AI instructor assignment data', data);
    return {
      success: false,
      data: data instanceof Error ? data.message : String(data),
    };
  }
}

export async function getStudentInstructors(studentId: string) {
  try {
    const supabase = await createClient();

    const { data: assignments, error } = await supabase
      .from('student_ai_instructors')
      .select(
        `
        *,
        instructor:ai_instructors(*)
      `,
      )
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to get student instructors', error);
      return [];
    }

    return assignments || [];
  } catch (error) {
    /* Error handled silently */
    logger.error('Get student instructors error', error);
    return [];
  }
}
