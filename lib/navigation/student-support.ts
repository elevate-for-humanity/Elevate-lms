/** Retired topic URLs remain bookmarks into one complete support page. */
export const STUDENT_SUPPORT_TOPICS = ['academic', 'financial-aid', 'career', 'counseling', 'accessibility', 'scheduling'] as const;
export function studentSupportTopicHref(topic: string): string | null {
  return (STUDENT_SUPPORT_TOPICS as readonly string[]).includes(topic) ? `/student-support#${topic}` : null;
}
