import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { getServerPublicSupabaseConfig, type SupabasePublicConfig } from '@/lib/supabase/public-config';
import { timedFetch } from '@/lib/supabase/timed-fetch';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';
import { MARKETING_HOST } from '@/lib/routing/portal-map';
import { CLEANING_SITE, CLEANING_URL, CleaningError, hashCapability, newCapability } from './server';
import { verifiedProviderSession, type ProviderProofDatabase } from './provider-email-proof';
import { applyProviderEmailSendLimit, applyProviderRequestLimit } from './provider-rate-limit';

export const PROVIDER_VERIFICATION_PATH = '/api/tenant-sites/cleaning/provider/verification';
export const PROVIDER_VERIFICATION_CALLBACK = `${PROVIDER_VERIFICATION_PATH}/callback`;
export const PROVIDER_VERIFICATION_QUERY = 'provider_email_verification';
export const PROVIDER_CHALLENGE_SECONDS = 600;
export type ProviderVerificationMarker = 'success' | 'expired' | 'wrong_browser' | 'failed';
const CAPABILITY = /^[a-f0-9]{64}$/;
const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;
const STORAGE_KEY = 'cleaning-provider-email-proof';
const VERIFIER_KEY = `${STORAGE_KEY}-code-verifier`;
type SessionClient = Pick<SupabaseClient, 'auth'>;
type FlowOptions = { config?: SupabasePublicConfig; fetchImpl?: typeof fetch };

export class ProviderVerificationFailure extends Error {
  constructor(
    readonly marker: Exclude<ProviderVerificationMarker, 'success'>,
    readonly challengeConsumed = false,
  ) {
    super('Provider email verification could not be completed.');
  }
}

export function providerVerificationCookie() {
  const secure = process.env.NODE_ENV === 'production';
  return {
    name: secure ? '__Host-efh-cleaning-provider-verification' : 'efh-cleaning-provider-verification',
    options: { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: PROVIDER_CHALLENGE_SECONDS },
  };
}

function marketingOrigin() {
  const owner = new URL(MARKETING_HOST);
  if (!['http:', 'https:'].includes(owner.protocol) || owner.username || owner.password ||
      owner.pathname !== '/' || owner.search || owner.hash) throw new CleaningError('Provider verification is temporarily unavailable.', 503);
  return owner.origin;
}

export function requireProviderVerificationOrigin(request: NextRequest) {
  if (new URL(request.url).origin !== marketingOrigin()) {
    throw new CleaningError('Open the provider profile on the cleaning website to verify your email.', 403);
  }
}

export function providerVerificationReturn(marker: ProviderVerificationMarker) {
  const target = new URL(`${new URL(CLEANING_URL).pathname}/provider`, marketingOrigin());
  target.searchParams.set(PROVIDER_VERIFICATION_QUERY, marker);
  return target;
}

/** An email callback has no tenant-site Referer. Its site and origin are fixed. */
export async function providerVerificationCallbackDatabase(request: NextRequest) {
  requireProviderVerificationOrigin(request);
  const limited = await applyProviderRequestLimit(request, 'callback');
  if (limited) throw new CleaningError('Please wait before trying again.', 429, undefined, limited.headers.get('Retry-After'));
  const db = await requireAdminClient();
  const { data: site, error } = await db.from('user_websites')
    .select('id,user_id,is_published,site_config').eq('id', CLEANING_SITE).maybeSingle();
  if (error || !site?.is_published ||
      (site.site_config?.meta?.cleaningProviderOnboardingEnabled !== true && site.site_config?.meta?.cleaningNetworkEnabled !== true)) {
    throw new CleaningError('Cleaning provider enrollment is not enabled.', 503);
  }
  // This is the public hosting subscription check, never applicant ownership.
  if (site.user_id && !(await getWebsiteBuilderAccess(site.user_id, db)).allowed) {
    throw new CleaningError('Cleaning website unavailable.', 503);
  }
  return db;
}

async function proofRpc(db: ProviderProofDatabase, name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args);
  if (error) throw new CleaningError('Provider email verification is temporarily unavailable. Please try again.', 503);
  return data;
}

function flowClient(options: FlowOptions, verifier?: string, storeVerifier?: (value: string) => Promise<void>) {
  const config = options.config ?? getServerPublicSupabaseConfig();
  if (!config || !globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new CleaningError('Provider email verification is temporarily unavailable.', 503);
  }
  // The installed SDK uses supplied storage only with persistSession=true.
  // This store is server-local; it never reads or writes browser auth cookies.
  const values = new Map<string, string>();
  if (verifier) values.set(VERIFIER_KEY, JSON.stringify(verifier));
  const client = createSupabaseClient(config.url, config.anonKey, {
    auth: {
      flowType: 'pkce', storageKey: STORAGE_KEY,
      persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
      storage: {
        getItem: key => values.get(key) ?? null,
        async setItem(key, value) {
          if (key === VERIFIER_KEY) {
            const raw: unknown = JSON.parse(value);
            if (typeof raw !== 'string' || !VERIFIER.test(raw)) throw new Error('Invalid provider verification key.');
            await storeVerifier?.(raw);
          }
          values.set(key, value);
        },
        removeItem(key) { values.delete(key); },
      },
    },
    global: { fetch: async (input, init) => {
      try { return await (options.fetchImpl ?? timedFetch)(input, init); }
      catch { throw new Error('Provider verification service unavailable.'); }
    } },
  });
  return { client, clear: () => values.clear() };
}

export async function requestProviderEmailVerification({ db, user, session, request, ...options }: FlowOptions & {
  db: ProviderProofDatabase; user: User | null; session: SessionClient; request: Request;
}) {
  const actor = await verifiedProviderSession(user, session, false);
  const limited = await applyProviderEmailSendLimit(request, actor.id);
  if (limited) throw new CleaningError('Please wait before requesting another verification email.', 429, undefined, limited.headers.get('Retry-After'));
  const state = newCapability(), browserNonce = newCapability();
  const stateHash = hashCapability(state);
  const callback = new URL(PROVIDER_VERIFICATION_CALLBACK, marketingOrigin());
  callback.searchParams.set('state', state);
  let stored = false;
  const flow = flowClient(options, undefined, async verifier => {
    const receipt = await proofRpc(db, 'cleaning_provider_proof_begin', {
      p_website_id: CLEANING_SITE, p_user_id: actor.id, p_session_id: actor.sessionId,
      p_email: actor.email, p_state_hash: stateHash, p_browser_hash: hashCapability(browserNonce), p_verifier: verifier,
    });
    if (!receipt || typeof receipt !== 'object' || !('challenge_id' in receipt) || !receipt.challenge_id) {
      throw new CleaningError('Provider email verification is temporarily unavailable.', 503);
    }
    stored = true;
  });
  try {
    const initialized = await flow.client.auth.initialize();
    if (initialized.error) throw new CleaningError('Provider email verification is temporarily unavailable.', 503);
    const { error } = await flow.client.auth.signInWithOtp({
      email: actor.email,
      options: { shouldCreateUser: false, emailRedirectTo: callback.href },
    });
    if (error) throw new CleaningError(
      error.status === 429 ? 'Please wait before requesting another verification email.' : 'The verification email could not be sent. Please try again.',
      error.status === 429 ? 429 : 503,
    );
    if (!stored) throw new CleaningError('Provider email verification is temporarily unavailable.', 503);
    return { browserNonce };
  } catch (error) {
    // A send failure cannot leave a reusable server verifier. A failed cleanup
    // still expires under the database deadline and never grants access.
    try { await db.rpc('cleaning_provider_proof_cancel', { p_website_id: CLEANING_SITE, p_user_id: actor.id, p_state_hash: stateHash }); } catch { /* bounded expiry remains authoritative */ }
    throw error;
  } finally { flow.clear(); }
}

export async function completeProviderEmailVerification({ db, session, state, browserNonce, code, ...options }: FlowOptions & {
  db: ProviderProofDatabase; session: SessionClient; state: string | null;
  browserNonce: string | undefined; code: string | null;
}) {
  if (!browserNonce || !CAPABILITY.test(browserNonce)) throw new ProviderVerificationFailure('wrong_browser');
  if (!state || !CAPABILITY.test(state) || !code || !/^[A-Za-z0-9._~-]{8,2048}$/.test(code)) {
    throw new ProviderVerificationFailure('expired');
  }
  const current = await session.auth.getUser();
  if (current.error) throw new ProviderVerificationFailure('failed');
  const original = await verifiedProviderSession(current.data.user, session, false);
  const claimHash = hashCapability(newCapability());
  const claimed = await proofRpc(db, 'cleaning_provider_proof_claim', {
    p_website_id: CLEANING_SITE, p_state_hash: hashCapability(state), p_browser_hash: hashCapability(browserNonce),
    p_claim_hash: claimHash, p_user_id: original.id, p_session_id: original.sessionId, p_email: original.email,
  });
  if (!claimed || typeof claimed !== 'object') throw new ProviderVerificationFailure('expired');
  const challenge = claimed as Record<string, unknown>;
  if (challenge.user_id !== original.id || challenge.email !== original.email || challenge.session_id !== original.sessionId ||
      typeof challenge.challenge_id !== 'string' || typeof challenge.verifier !== 'string' || !VERIFIER.test(challenge.verifier) ||
      typeof challenge.expires_at !== 'string' || !Number.isFinite(Date.parse(challenge.expires_at)) || Date.parse(challenge.expires_at) <= Date.now()) {
    throw new ProviderVerificationFailure('expired', true);
  }
  // Only this successfully matched claim consumed the challenge. Invalid
  // callback navigation must not erase a different, still-pending browser nonce.
  let flow: ReturnType<typeof flowClient> | undefined;
  try {
    flow = flowClient(options, challenge.verifier);
    const initialized = await flow.client.auth.initialize();
    if (initialized.error) throw new ProviderVerificationFailure('failed');
    const exchanged = await flow.client.auth.exchangeCodeForSession(code);
    if (exchanged.error || !exchanged.data.session) throw new ProviderVerificationFailure('expired');
    const verified = await flow.client.auth.getUser();
    if (verified.error) throw new ProviderVerificationFailure('failed');
    const mailbox = await verifiedProviderSession(verified.data.user, flow.client);
    if (mailbox.id !== original.id || mailbox.email !== original.email || mailbox.sessionId === original.sessionId) {
      throw new ProviderVerificationFailure('failed');
    }
    // The new session must still identify the original mailbox. Completion also
    // checks current Auth records atomically. Do not require the old session to
    // survive a valid login: single-session Auth can revoke it during exchange.
    const completed = await proofRpc(db, 'cleaning_provider_proof_complete', {
      p_challenge_id: challenge.challenge_id, p_claim_hash: claimHash,
      p_user_id: mailbox.id, p_session_id: mailbox.sessionId, p_email: mailbox.email,
    });
    if (completed !== true) throw new ProviderVerificationFailure('expired');
    const saved = await session.auth.setSession({
      access_token: exchanged.data.session.access_token, refresh_token: exchanged.data.session.refresh_token,
    });
    if (saved.error || !saved.data.user) throw new ProviderVerificationFailure('failed');
    const installed = await verifiedProviderSession(saved.data.user, session);
    if (installed.id !== mailbox.id || installed.email !== mailbox.email || installed.sessionId !== mailbox.sessionId) {
      throw new ProviderVerificationFailure('failed');
    }
  } catch (error) {
    throw new ProviderVerificationFailure(error instanceof ProviderVerificationFailure ? error.marker : 'failed', true);
  } finally { flow?.clear(); }
}
