import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';

const file = process.env.EXTERNAL_COURSE_RESULT_PATH;
if (!file?.startsWith('/tmp/elevate-external-') || !file.endsWith('/result.json'))
  throw Error('PRIVATE_EXECUTION_REPORT_PATH_REQUIRED');
const {attemptId, workerId, usage} = JSON.parse(await readFile(file, 'utf8'));
if (attemptId !== process.env.EXTERNAL_COURSE_ATTEMPT_ID) throw Error('EXECUTION_REPORT_MISMATCH');
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw Error('WORKER_DATABASE_CONFIG_REQUIRED');
const db = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
const result = await db.rpc('finish_external_course_execution', {
  p_attempt: attemptId, p_worker: workerId, p_usage: usage,
});
if (result.error) throw Error('EXTERNAL_SETTLEMENT_RECONCILIATION_REQUIRED');
console.info(JSON.stringify({event: 'external_course_usage_settled', attemptId,
  providerInvoiceReconciled: false, playbackAccepted: false}));
