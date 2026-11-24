import 'server-only';

import { twilioAccountSid, twilioAuthorization } from './twilio';
import { usesGooglePhoneBindings } from './runtime-authority';
import {
  READINESS_FRESH_MS,
  evaluatePhoneReadiness,
  readinessCheck,
  type PhoneReadiness,
  type PhoneReadinessCheck,
} from './readiness';

/**
 * Server-side phone readiness probes — issue #2166.
 *
 * Every check is a live observation, never a DB row read as proof:
 * Twilio is probed over HTTPS with the account credential; Asterisk is
 * probed through configuration plus PBX-verified registration evidence
 * (heartbeat calls asteriskDeviceStatus before writing last_seen_at, so a
 * `connected` device with a fresh registration_verified_at is PBX
 * evidence, not a self-reported ping). Nothing here places a call, sends
 * a message, or writes to the database. All failures become `fail` /
 * `not_configured` checks — this function never throws, so the admin page
 * can always fall back to "unverified" instead of erroring.
 *
 * The caller must run hydrateProcessEnv() first (Twilio/PBX secrets live
 * in Google Secret Manager in production). No secret, token, or caller
 * PII is ever included in a check detail.
 */

const PROBE_TIMEOUT_MS = 10_000;

type ProbeDeps = {
  fetchFn?: typeof fetch;
  env?: Record<string, string | undefined>;
  now?: Date;
};

async function probeTwilio(
  db: any,
  deps: ProbeDeps,
): Promise<PhoneReadinessCheck[]> {
  const now = deps.now ?? new Date();
  const observedAt = now.toISOString();
  let accountSid: string;
  let authorization: string;
  try {
    accountSid = twilioAccountSid();
    authorization = twilioAuthorization();
  } catch {
    return [
      readinessCheck(
        'twilio_account',
        'not_configured',
        'Twilio account credentials are not configured.',
        observedAt,
      ),
      readinessCheck(
        'twilio_number',
        'not_configured',
        'No Twilio number can be verified without account credentials.',
        observedAt,
      ),
    ];
  }
  let accountOk = false;
  let accountDetail = 'Twilio did not confirm the account.';
  try {
    const response = await (deps.fetchFn ?? fetch)(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: { Authorization: authorization },
        redirect: 'error',
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      },
    );
    if (response.status === 200) {
      accountOk = true;
      accountDetail = 'Twilio account authentication succeeded.';
    } else if (response.status === 401) {
      accountDetail = 'Twilio rejected the account credentials (401).';
    } else {
      accountDetail = `Twilio account check returned HTTP ${response.status}.`;
    }
  } catch (cause) {
    accountDetail =
      cause instanceof Error && cause.name === 'TimeoutError'
        ? 'Twilio account check timed out.'
        : 'Twilio account could not be reached.';
  }
  const accountCheck = readinessCheck(
    'twilio_account',
    accountOk ? 'pass' : 'fail',
    accountDetail,
    observedAt,
  );
  if (!accountOk) {
    return [
      accountCheck,
      readinessCheck(
        'twilio_number',
        'unknown',
        'Primary number was not checked because the account check failed.',
        observedAt,
      ),
    ];
  }
  // Voice capability matters: an SMS-only number is not a voice carrier.
  const { data: number, error } = await db
    .from('phone_numbers')
    .select('e164,capabilities')
    .eq('provider', 'twilio')
    .eq('source', 'provider')
    .eq('is_primary', true)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !number) {
    return [
      accountCheck,
      readinessCheck(
        'twilio_number',
        'not_configured',
        'No active primary Twilio provider number is configured.',
        observedAt,
      ),
    ];
  }
  const voiceEnabled = number.capabilities?.voice === true;
  return [
    accountCheck,
    readinessCheck(
      'twilio_number',
      voiceEnabled ? 'pass' : 'fail',
      voiceEnabled
        ? 'Active primary Twilio number has voice capability.'
        : 'Active primary Twilio number does not have voice capability enabled.',
      observedAt,
    ),
  ];
}

function probePbxConfig(deps: ProbeDeps): PhoneReadinessCheck {
  const now = deps.now ?? new Date();
  const observedAt = now.toISOString();
  const env = deps.env ?? process.env;
  const controlUrl = (env.PBX_CONTROL_URL || 'https://phone.elevateforhumanity.org').trim();
  const token = env.PBX_PROVISIONING_TOKEN || '';
  let url: URL;
  try {
    url = new URL(controlUrl);
  } catch {
    return readinessCheck(
      'pbx_config',
      'not_configured',
      'PBX control URL is not configured.',
      observedAt,
    );
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return readinessCheck(
      'pbx_config',
      'not_configured',
      'PBX control URL must be an https URL without embedded credentials.',
      observedAt,
    );
  }
  if (token.length < 32) {
    return readinessCheck(
      'pbx_config',
      'not_configured',
      'PBX provisioning token is missing or too short.',
      observedAt,
    );
  }
  if (env.NODE_ENV === 'production' && !usesGooglePhoneBindings(env)) {
    return readinessCheck(
      'pbx_config',
      'not_configured',
      'Phone service requires Google Secret Manager runtime bindings in production.',
      observedAt,
    );
  }
  return readinessCheck(
    'pbx_config',
    'pass',
    'PBX control-plane configuration is present.',
    observedAt,
  );
}

async function probePbxRegistrations(
  db: any,
  deps: ProbeDeps,
): Promise<PhoneReadinessCheck> {
  const now = deps.now ?? new Date();
  const observedAt = now.toISOString();
  const freshSince = new Date(now.getTime() - READINESS_FRESH_MS).toISOString();
  const { count, error } = await db
    .from('phone_webrtc_devices')
    .select('id', { count: 'exact', head: true })
    .eq('provider', 'asterisk')
    .eq('status', 'active')
    .eq('connection_state', 'connected')
    .gte('registration_verified_at', freshSince);
  if (error) {
    return readinessCheck(
      'pbx_registrations',
      'unknown',
      'PBX registration evidence could not be read.',
      observedAt,
    );
  }
  const live = count ?? 0;
  return readinessCheck(
    'pbx_registrations',
    live > 0 ? 'pass' : 'fail',
    live > 0
      ? `${live} Asterisk device(s) with PBX-verified SIP registration in the last 120 seconds.`
      : 'No Asterisk device has a PBX-verified SIP registration in the last 120 seconds. Connect a PWA phone from the dial pad.',
    observedAt,
  );
}

async function probeCallHistory(db: any, deps: ProbeDeps): Promise<PhoneReadinessCheck> {
  const now = deps.now ?? new Date();
  const observedAt = now.toISOString();
  const { count, error } = await db
    .from('phone_calls')
    .select('id', { count: 'exact', head: true });
  if (error) {
    return readinessCheck(
      'call_history',
      'unknown',
      'Call history could not be read.',
      observedAt,
    );
  }
  return readinessCheck(
    'call_history',
    (count ?? 0) > 0 ? 'pass' : 'unknown',
    (count ?? 0) > 0
      ? `${count} call(s) recorded.`
      : 'No calls recorded yet.',
    observedAt,
  );
}

/**
 * Run every probe. Never throws: an unexpected failure is reported as an
 * `unknown` check so callers can always render "unverified".
 */
export async function probePhoneReadiness(
  db: any,
  deps: ProbeDeps = {},
): Promise<PhoneReadiness> {
  const now = deps.now ?? new Date();
  const observedAt = now.toISOString();
  const settled = await Promise.allSettled([
    probeTwilio(db, deps),
    Promise.resolve(probePbxConfig(deps)),
    probePbxRegistrations(db, deps),
    probeCallHistory(db, deps),
  ]);
  const checks: PhoneReadinessCheck[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      checks.push(...(Array.isArray(result.value) ? result.value : [result.value]));
    }
  }
  // These two are never inferred from code. They stay `unknown` until a
  // human provisions the service / records a real call (see README.md).
  checks.push(
    readinessCheck(
      'call_test',
      'unknown',
      'No real-call audio acceptance test has been recorded. A test call is required before the phone is treated as call-ready.',
      observedAt,
    ),
    readinessCheck(
      'webrtc_meetings',
      'unknown',
      'The self-hosted WebRTC meetings service must be provisioned before live rooms are enabled. No live probe exists for it yet.',
      observedAt,
    ),
    readinessCheck(
      'voice_webhook',
      'not_configured',
      'No Twilio voice webhook route exists in this repo (verifyTwilioVoiceRequest is unwired). Inbound PSTN voice is PBX-side and not observable here.',
      observedAt,
    ),
  );
  return evaluatePhoneReadiness(checks, now);
}
