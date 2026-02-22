import { supa } from './supa';

export type Course = {
  id: string;
  program_id: string | null;
  code: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
};

export type Lesson = {
  id: string;
  course_id: string;
  idx: number;
  title: string;
  video_url: string | null;
  html: string | null;
};

export async function listCourses() {
  const { data, error } = await supa
    .from('training_courses')
    .select('id, program_id, code, title, summary, cover_url')
    .order('title');
  if (error) throw error;
  return data as Course[];
}

export async function listCoursesByProgram(programId: string) {
  const { data, error } = await supa
    .from('training_courses')
    .select('id, program_id, code, title, summary, cover_url')
    .eq('program_id', programId)
    .order('title');
  if (error) throw error;
  return data as Course[];
}

export async function getCourse(courseId: string) {
  const { data, error } = await supa
    .from('training_courses')
    .select('id, program_id, code, title, summary, cover_url')
    .eq('id', courseId)
    .single();
  if (error) throw error;
  return data as Course;
}

export async function listLessons(courseId: string) {
  const { data, error } = await supa
    .from('training_lessons')
    .select('id, course_id, idx, title, video_url, html')
    .eq('course_id', courseId)
    .order('idx', { ascending: true });
  if (error) throw error;
  return data as Lesson[];
}

export async function getLesson(lessonId: string) {
  const { data, error } = await supa
    .from('training_lessons')
    .select('id, course_id, idx, title, video_url, html')
    .eq('id', lessonId)
    .single();
  if (error) throw error;
  return data as Lesson;
}

export async function upsertProgress(lessonId: string, pct: number) {
  const user = (await supa.auth.getUser()).data.user;
  if (!user) throw new Error('Not signed in');
  const { error } = await supa.from('lesson_progress').upsert({
    user_id: user.id,
    lesson_id: lessonId,
    percent: Math.min(100, Math.max(0, pct)),
  });
  if (error) throw error;
}
