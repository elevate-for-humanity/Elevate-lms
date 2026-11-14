import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import {createClient} from '@supabase/supabase-js';
import {submitExecution, readExecution, cancelExecution} from '../../lib/compute/execution.mjs';
import {createModalProvider} from '../../lib/compute/modal-provider.mjs';

/** Operator-only entry point. Public Admin remains on Google until acceptance.
 * Identity, entitlement, policies and credits are checked inside SQL. */
export async function courseExecution({args = process.argv.slice(2), env = process.env} = {}) {
  const {values} = parseArgs({args, options: {
    action: {type: 'string'}, job: {type: 'string'}, actor: {type: 'string'},
    key: {type: 'string'}, attempt: {type: 'string'},
  }});
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !env.SUPABASE_SERVICE_ROLE_KEY) throw Error('OPERATOR_DATABASE_CONNECTION_REQUIRED');
  const db = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {auth: {persistSession: false, autoRefreshToken: false}});
  if (values.action === 'status') return readExecution(db, values.attempt);
  if (env.EXTERNAL_COMPUTE_ENABLED !== 'true') throw Error('EXTERNAL_COMPUTE_DISABLED');
  if (values.action === 'prepare') {
    const {data, error} = await db.rpc('prepare_external_course_execution', {
      p_job: values.job, p_actor: values.actor, p_key: values.key,
    });
    if (error) throw error;
    return {attemptId: data?.[0]?.id, state: data?.[0]?.state};
  }
  const providers = {modal: createModalProvider({env})};
  if (values.action === 'submit') return submitExecution(db, values.attempt, providers);
  if (values.action === 'cancel') return cancelExecution(db, values.attempt, providers);
  throw Error('ACTION_MUST_BE_PREPARE_SUBMIT_STATUS_OR_CANCEL');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  courseExecution().then(result => console.info(JSON.stringify(result))).catch(() => {
    // Avoid logging Supabase/provider objects that can contain credentials.
    console.error('EXTERNAL_COURSE_OPERATION_FAILED_CHECK_AUTHORIZED_RECEIPT');
    process.exitCode = 1;
  });
