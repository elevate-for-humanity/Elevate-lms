import { pathToFileURL } from 'node:url';

export async function verifyUltimateMediaSchema({ url, secret, request = fetch, practicalOnly = false }) {
  if (!url || !secret) throw new Error('Supabase URL and service-role credential are required for the read-only Ultimate schema gate');
  const read = (resource) => request(`${url.replace(/\/$/, '')}/rest/v1/${resource}`, {
    method: 'GET', headers: { apikey: secret, Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(30000),
  });
  if (!practicalOnly) {
    const response = await read('rpc/ultimate_media_wakeup_ready');
    if (!response.ok || await response.json() !== true)
      throw new Error('Ultimate media wakeup schema is not ready. Apply 20261004150000_ultimate_media_dependency_wakeup.sql through the official Supabase Migrations workflow before deploying Admin or Ultimate worker. No production data was changed by this check.');
  }
  const contracts = {
    course_practical_submissions: 'id,learner_id,course_id,lesson_id,interaction_id,competency_keys,evidence,learner_attestation,status,submitted_at,updated_at',
    course_practical_reviews: 'id,submission_id,reviewer_id,decision,competency_results,comments,reviewed_at',
    learning_action_events: 'learner_id,course_id,lesson_id,action,source_type,source_id,payload',
    instructor_assignments: 'instructor_id,course_id,active',
    course_lessons: 'id,course_id,practical_required,competency_checks,content_json',
    ultimate_learner_test_runs: 'id,learner_id,lesson_build_id,artifact_hash,media_sha256,snapshot,progress,expires_at',
  };
  for (const [table, columns] of Object.entries(contracts)) {
    // Request zero records: establish schema availability without reading learner data.
    const response = await read(`${table}?select=${columns}&limit=0`);
    if (!response.ok) throw new Error(`Required Ultimate practical schema is unavailable: ${table} (HTTP ${response.status}). No production data was changed by this check.`);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyUltimateMediaSchema({ url: process.env.NEXT_PUBLIC_SUPABASE_URL, secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
    practicalOnly: process.argv.includes('--existing-practical-only') });
  console.info('Ultimate schema contracts verified (read-only).');
}
