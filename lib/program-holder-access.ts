import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

export interface ProgramHolderStudent {
  student_id: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_title: string;
  enrollment_status: string;
  progress: number;
  enrolled_at: string;
}

export async function assignProgramToHolder(
  holderId: string,
  programSlug: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('assign_program_to_holder', {
    p_holder_id: holderId,
    p_program_slug: programSlug,
  });

  if (error) {
    logger.error('Error assigning program to holder:', error);
    return null;
  }

  return data;
}

export async function getProgramHolderStudents(
  holderId: string
): Promise<ProgramHolderStudent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_program_holder_students', {
    p_holder_id: holderId,
  });

  if (error) {
    logger.error('Error fetching program holder students:', error);
    return [];
  }

  return data || [];
}

export async function getProgramHolderPrograms(holderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('program_holder_programs')
    .select('*')
    .eq('program_holder_id', holderId);

  if (error) {
    logger.error('Error fetching program holder programs:', error);
    return [];
  }

  return data || [];
}

export async function canAccessStudent(
  holderId: string,
  studentId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      course_id,
      courses!inner(id, category, slug)
    `)
    .eq('user_id', studentId)
    .single();

  if (error || !data) {
    return false;
  }

  const { data: programs } = await supabase
    .from('program_holder_programs')
    .select('program_slug')
    .eq('program_holder_id', holderId);

  if (!programs || programs.length === 0) {
    return false;
  }

  const course = data.courses as any;
  return programs.some(
    (p) =>
      course.category === p.program_slug ||
      course.slug.startsWith(p.program_slug)
  );
}
