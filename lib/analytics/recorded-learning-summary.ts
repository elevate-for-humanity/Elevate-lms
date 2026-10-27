import { summarizeRecordedActivity, type RecordedActivity } from '@/lib/learner/recorded-activity';

type Enrollment = { user_id: string | null; course_id: string | null; program_id: string | null; status: string; updated_at: string | null };
type Lesson = { id: string; course_id: string };
type Activity = RecordedActivity & { user_id: string | null; student_id?: string | null };
export function summarizeAdminLearning(input: {
  learners: { id: string }[]; enrollments: Enrollment[]; courses: { id: string; title: string }[];
  lessons: Lesson[]; progress: { user_id: string; lesson_id: string }[]; activity: Activity[];
}, now = new Date()) {
  const learnerIds = new Set(input.learners.map(row => row.id));
  const enrollments = new Map<string, Enrollment>();
  for (const row of input.enrollments) {
    if (!row.user_id || !learnerIds.has(row.user_id)) continue;
    const key = `${row.user_id}:${row.program_id}:${row.course_id}`;
    const prior = enrollments.get(key);
    if (!prior || (Date.parse(row.updated_at ?? '') || 0) > (Date.parse(prior.updated_at ?? '') || 0)) enrollments.set(key, row);
  }
  const lessonIds = new Map<string, Set<string>>();
  for (const lesson of input.lessons) {
    const ids = lessonIds.get(lesson.course_id) ?? new Set<string>(); ids.add(lesson.id); lessonIds.set(lesson.course_id, ids);
  }
  const completedByUser = new Map<string, Set<string>>();
  for (const row of input.progress) {
    const ids = completedByUser.get(row.user_id) ?? new Set<string>(); ids.add(row.lesson_id); completedByUser.set(row.user_id, ids);
  }
  const complete = (row: Enrollment) => {
    if (row.status === 'completed') return true;
    const required = row.course_id ? lessonIds.get(row.course_id) : null;
    return Boolean(required?.size && [...required].every(id => completedByUser.get(row.user_id!)?.has(id)));
  };
  const rows = [...enrollments.values()];
  const activity = input.activity.filter(row => learnerIds.has(row.user_id || row.student_id || ''));
  const weekly = summarizeRecordedActivity(activity, now);
  const start = weekly.last7Days[0].date;
  const end = weekly.last7Days.at(-1)!.date;
  const activeIds = new Set(activity.filter(row => {
    const date = (row.activity_date || row.created_at || '').slice(0, 10);
    return date >= start && date <= end;
  }).map(row => row.user_id || row.student_id));
  return {
    totalLearners: learnerIds.size, activeThisWeek: activeIds.size,
    completionRate: rows.length ? Math.round(rows.filter(complete).length / rows.length * 100) : 0,
    averageTimePerWeekHours: learnerIds.size ? Math.round(weekly.averageTimePerWeekHours / learnerIds.size * 10) / 10 : 0,
    byProgram: input.courses.map(course => {
      const courseRows = rows.filter(row => row.course_id === course.id);
      const ids = new Set(courseRows.map(row => row.user_id));
      const finished = new Set(courseRows.filter(complete).map(row => row.user_id));
      return { programName: course.title, learners: ids.size, completionRate: ids.size ? Math.round(finished.size / ids.size * 100) : 0 };
    }),
  };
}
