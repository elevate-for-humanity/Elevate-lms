import 'server-only';

import type { SupabaseClient } from '@/lib/supabase';

/** Call only after authorizing the learner or the course's grader. */
export async function assignmentEvidenceLinks(
  db: SupabaseClient,
  submission: {
    user_id?: string | null;
    student_id?: string | null;
    assignment_id: string;
    submission_url?: string | null;
    file_paths?: string[] | null;
    file_path?: string | null;
  },
) {
  const owner = submission.user_id || submission.student_id;
  if (!owner) return [];
  const paths = [
    ...new Set(
      [...(submission.file_paths || []), submission.file_path].filter(
        (path): path is string =>
          typeof path === 'string' &&
          path.startsWith(`${owner}/assignments/${submission.assignment_id}/`),
      ),
    ),
  ];
  const urls = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await db.storage.from('documents').createSignedUrl(path, 600);
      if (error) throw error;
      return data.signedUrl;
    }),
  );
  if (submission.submission_url) {
    try {
      const url = new URL(submission.submission_url);
      if (['https:', 'http:'].includes(url.protocol)) urls.push(url.href);
    } catch {
      /* Do not render malformed legacy links. */
    }
  }
  return urls;
}
