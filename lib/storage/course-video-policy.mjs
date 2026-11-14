/** Stable source references for generated videos must point outside Supabase. */
export function isExternalCourseVideoReference(source) {
  try {
    const url = new URL(source);
    return url.protocol === 'https:' && !url.username && !url.password &&
      !/(?:^|\.)supabase\.(?:co|com)$/i.test(url.hostname);
  } catch { return false; }
}
