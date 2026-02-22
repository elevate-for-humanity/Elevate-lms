import { supa } from './supa';

export type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_number: string;
};

export async function checkCourseCompletion(
  userId: string,
  courseId: string
): Promise<boolean> {
  // Get all lessons for the course
  const { data: lessons } = await supa
    .from('training_lessons')
    .select('id')
    .eq('course_id', courseId);

  if (!lessons || lessons.length === 0) return false;

  // Check if user has 100% progress on all lessons
  const { data: progress } = await supa
    .from('lesson_progress')
    .select('lesson_id, percent')
    .eq('user_id', userId)
    .in(
      'lesson_id',
      lessons.map((l) => l.id)
    );

  if (!progress || progress.length !== lessons.length) return false;

  return progress.every((p) => p.percent === 100);
}

export async function generateCertificate(
  userId: string,
  courseId: string
): Promise<Certificate> {
  // Check if certificate already exists
  const { data: existing } = await supa
    .from('certificates')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (existing) return existing as Certificate;

  // Check completion
  const isComplete = await checkCourseCompletion(userId, courseId);
  if (!isComplete) {
    throw new Error('Course not completed');
  }

  // Generate certificate number
  const certificateNumber = `EFH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Insert certificate
  const { data, error } = await supa
    .from('certificates')
    .insert([
      {
        user_id: userId,
        course_id: courseId,
        certificate_number: certificateNumber,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data as Certificate;
}

export async function getUserCertificates(
  userId: string
): Promise<Certificate[]> {
  const { data, error } = await supa
    .from('certificates')
    .select('*, courses(title, code)')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return data as Certificate[];
}

export async function getCertificate(certificateId: string): Promise<any> {
  const { data, error } = await supa
    .from('certificates')
    .select('*, courses(title, code), profiles(email)')
    .eq('id', certificateId)
    .single();

  if (error) throw error;
  return data;
}

export async function verifyCertificate(
  certificateNumber: string
): Promise<any> {
  const { data, error } = await supa
    .from('certificates')
    .select('*, courses(title, code), profiles(email)')
    .eq('certificate_number', certificateNumber)
    .single();

  if (error) return null;
  return data;
}
