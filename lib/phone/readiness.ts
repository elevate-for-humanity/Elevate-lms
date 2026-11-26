/**
 * Phone readiness evaluation — pure, no I/O, no secrets.
 *
 * Issue #2166: the Admin Communications Hub must never mark the phone
 * network "ready" from a saved DB row or a bare API 200. Readiness is a
 * server-side, time-bounded evaluation of independent evidence:
 *
 *   - carrier: Twilio account authentication + an active primary Twilio
 *     number with voice capability (live probe, see readiness-probe.ts)
 *   - pbx: PBX control-plane configuration + at least one device whose
 *     SIP registration was verified by Asterisk within the freshness
 *     window (heartbeat calls asteriskDeviceStatus; see
 *     apps/lms/app/api/program-holder/phone/route.ts)
 *   - call test: a real call with two-way audio. This is NEVER inferred
 *     from code. It stays `unknown` until a human records a test call
 *     against the acceptance matrix in README.md.
 *   - voice: inbound PSTN voice (Twilio -> Asterisk -> PARIS/menu).
 *     There is no Twilio voice webhook route in this repo and
 *     verifyTwilioVoiceRequest has no caller, so the inbound voice path
 *     is PBX-side and not observable here. `voiceReady` is therefore
 *     reported separately and never folded into `ready` silently.
 *
 * Evidence expires. A passing check observed more than
 * READINESS_FRESH_MS ago is stale and counts as `unknown`, never `pass`.
 */

export type ReadinessStatus = 'pass' | 'fail' | 'unknown' | 'not_configured';

export type ReadinessCheckId =
  | 'twilio_account'
  | 'twilio_number'
  | 'pbx_config'
  | 'pbx_registrations'
  | 'call_history'
  | 'call_test'
  | 'webrtc_meetings'
  | 'voice_webhook';

export type PhoneReadinessCheck = {
  id: ReadinessCheckId;
  label: string;
  status: ReadinessStatus;
  /** Redacted, human-actionable detail. Never a secret, token, or caller PII. */
  detail: string;
  observedAt: string | null;
};

export type PhoneReadiness = {
  /** PWA phone path: carrier + PBX + a live verified registration. */
  ready: boolean;
  /** Inbound PSTN voice path. False until a voice webhook/trunk is observable. */
  voiceReady: boolean;
  carrierReady: boolean;
  pbxReady: boolean;
  checks: PhoneReadinessCheck[];
  observedAt: string;
  /** Evidence must be re-probed after this time. */
  expiresAt: string;
};

/** SIP registration evidence is only trusted for 120s (matches isExtensionReachable). */
export const READINESS_FRESH_MS = 120_000;
/** Carrier/PBX probe results are re-checked at most every 5 minutes. */
export const READINESS_PROBE_TTL_MS = 300_000;

export const READINESS_CHECK_LABELS: Record<ReadinessCheckId, string> = {
  twilio_account: 'Twilio account authentication',
  twilio_number: 'Primary Twilio number (voice)',
  pbx_config: 'PBX control-plane configuration',
  pbx_registrations: 'Live Asterisk SIP registrations',
  call_history: 'Call history recorded',
  call_test: 'Real-call audio acceptance test',
  webrtc_meetings: 'Self-hosted WebRTC meetings service',
  voice_webhook: 'Inbound PSTN voice route (Twilio voice webhook)',
};

const REQUIRED_FOR_READY: ReadinessCheckId[] = [
  'twilio_account',
  'twilio_number',
  'pbx_config',
  'pbx_registrations',
];

export function readinessCheck(
  id: ReadinessCheckId,
  status: ReadinessStatus,
  detail: string,
  observedAt: string | null = null,
): PhoneReadinessCheck {
  return { id, label: READINESS_CHECK_LABELS[id], status, detail, observedAt };
}

function checkIsFresh(check: PhoneReadinessCheck, now: number): boolean {
  if (!check.observedAt) return false;
  const age = now - Date.parse(check.observedAt);
  return Number.isFinite(age) && age >= -5_000 && age <= READINESS_FRESH_MS;
}

export function evaluatePhoneReadiness(
  checks: PhoneReadinessCheck[],
  now = new Date(),
): PhoneReadiness {
  const byId = new Map(checks.map((c) => [c.id, c]));
  const nowMs = now.getTime();
  const requiredPass = REQUIRED_FOR_READY.every((id) => {
    const check = byId.get(id);
    return check?.status === 'pass' && checkIsFresh(check, nowMs);
  });
  const voiceCheck = byId.get('voice_webhook');
  const voiceReady =
    requiredPass &&
    voiceCheck?.status === 'pass' &&
    checkIsFresh(voiceCheck, nowMs);
  const observedAt = now.toISOString();
  return {
    ready: requiredPass,
    voiceReady,
    carrierReady:
      byId.get('twilio_account')?.status === 'pass' &&
      byId.get('twilio_number')?.status === 'pass',
    pbxReady:
      byId.get('pbx_config')?.status === 'pass' &&
      byId.get('pbx_registrations')?.status === 'pass',
    checks,
    observedAt,
    expiresAt: new Date(nowMs + READINESS_FRESH_MS).toISOString(),
  };
}

/** True only while the evaluation is still inside its freshness window. */
export function readinessIsFresh(readiness: PhoneReadiness, now = new Date()): boolean {
  const age = now.getTime() - Date.parse(readiness.observedAt);
  return Number.isFinite(age) && age >= -5_000 && age <= READINESS_FRESH_MS;
}

/**
 * One-line banner text for the admin page. Never claims more than the
 * evidence supports: a failed or stale probe reads as unverified.
 */
export function summarizePhoneReadiness(
  readiness: PhoneReadiness | null,
  now = new Date(),
): string {
  if (!readiness || !readinessIsFresh(readiness, now)) {
    return 'Live carrier status is unverified. Saved numbers and routes do not confirm phone registration, ringing, or two-way audio.';
  }
  if (readiness.ready) {
    const callTest = readiness.checks.find((c) => c.id === 'call_test');
    return callTest?.status === 'pass'
      ? 'Live carrier status: verified. Twilio, Asterisk registration, and a real-call audio test all passed.'
      : 'Live carrier status: verified for Twilio and Asterisk registration. A real-call audio acceptance test has not been recorded yet.';
  }
  const failing = readiness.checks
    .filter((c) => c.status === 'fail' || c.status === 'not_configured')
    .map((c) => c.label);
  return failing.length
    ? `Live carrier status: not verified — ${failing.join('; ')}.`
    : 'Live carrier status: not verified — evidence is incomplete.';
}
