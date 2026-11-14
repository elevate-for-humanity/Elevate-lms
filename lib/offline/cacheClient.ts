// lib/offline/cacheClient.ts
const KEY_COURSES = 'efh_cached_courses';

export type CachedCourse = {
  id: string;
  title: string;
  status: string;
  lastAccessedAt: string;
};

export function saveCoursesToLocal(courses: CachedCourse[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_COURSES, JSON.stringify(courses));
}

export function getCoursesFromLocal(): CachedCourse[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY_COURSES);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}
