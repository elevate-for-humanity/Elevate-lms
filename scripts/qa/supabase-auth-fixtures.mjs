const DEFAULT_ATTEMPTS = 4;
const DEFAULT_BASE_DELAY_MS = 1_000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorField(error, field) {
  if (!error || typeof error !== 'object') return undefined;
  return error[field];
}

export function formatSupabaseAuthError(error) {
  if (!error) return 'unknown Supabase Auth error';
  if (typeof error === 'string') return error;

  const message = errorField(error, 'message');
  const status = errorField(error, 'status');
  const code = errorField(error, 'code');
  const name = errorField(error, 'name');
  const parts = [];
  if (typeof message === 'string' && message.trim()) parts.push(message.trim());
  if (status !== undefined) parts.push(`status=${status}`);
  if (typeof code === 'string' && code) parts.push(`code=${code}`);
  if (typeof name === 'string' && name && name !== 'Error') parts.push(`type=${name}`);

  if (parts.length) return parts.join(' ');
  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== '{}' ? serialized : 'unstructured Supabase Auth error';
  } catch {
    return 'unstructured Supabase Auth error';
  }
}

export function isRetryableSupabaseAuthError(error) {
  const status = Number(errorField(error, 'status'));
  if (status === 429 || status >= 500) return true;

  const code = String(errorField(error, 'code') || '').toLowerCase();
  const message = formatSupabaseAuthError(error).toLowerCase();
  return [
    'fetch_failed',
    'network',
    'timeout',
    'timed out',
    'connection',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'service unavailable',
    'gateway',
    'temporarily unavailable',
    'unstructured supabase auth error',
  ].some((needle) => code.includes(needle) || message.includes(needle)) || message === '{}';
}

async function findAuthUserByEmail(db, email) {
  const perPage = 200;
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < perPage) return null;
  }
  throw new Error(`QA Auth lookup exceeded 5,000 users while resolving ${email}`);
}

/**
 * Idempotently creates a disposable Supabase Auth identity for production QA.
 * A timed-out create can still succeed server-side, so every retry first looks
 * up the deterministic email and adopts only an identity from this QA run.
 */
export async function createQaAuthUser({
  db,
  email,
  password,
  role,
  fullName,
  runId,
  label,
  attempts = DEFAULT_ATTEMPTS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  sleepFn = sleep,
}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const existing = await findAuthUserByEmail(db, email);
      if (existing) {
        if (existing.app_metadata?.qa_e2e !== true || String(existing.app_metadata?.qa_run_id) !== String(runId)) {
          throw new Error(`Refusing to reuse non-QA Auth identity ${email}`);
        }
        const { data, error } = await db.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          app_metadata: { ...existing.app_metadata, qa_e2e: true, qa_run_id: String(runId), role },
          user_metadata: { ...existing.user_metadata, qa_e2e: true, qa_run_id: String(runId), full_name: fullName },
        });
        if (error) throw error;
        if (!data?.user) throw new Error('Supabase Auth update returned no user');
        return data.user;
      }

      const { data, error } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { qa_e2e: true, qa_run_id: String(runId), role },
        user_metadata: { qa_e2e: true, qa_run_id: String(runId), full_name: fullName },
      });
      if (error) throw error;
      if (!data?.user) throw new Error('Supabase Auth create returned no user');
      return data.user;
    } catch (error) {
      lastError = error;
      const retryable = isRetryableSupabaseAuthError(error);
      console.error(`[qa-auth] ${label} attempt ${attempt}/${attempts}: ${formatSupabaseAuthError(error)}`);
      if (!retryable || attempt === attempts) break;
      const delay = Math.min(baseDelayMs * (2 ** (attempt - 1)), 8_000);
      await sleepFn(delay);
    }
  }

  throw new Error(`${label}: ${formatSupabaseAuthError(lastError)}`);
}
