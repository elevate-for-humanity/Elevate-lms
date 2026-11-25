/**
 * Voicemail greeting configuration (Admin → Communications Hub → Phone).
 *
 * A caller who lands in voicemail hears the mailbox's custom greeting when
 * Asterisk finds one installed for that mailbox (the `unavail` recording
 * app_voicemail plays instead of its stock prompts). This module is the
 * single source of truth for what that greeting should be:
 *
 *   1. the extension's own greeting (communication_extensions), else
 *   2. the phone system's default greeting (phone_systems), else
 *   3. nothing — the mailbox keeps Asterisk's stock prompts, which is
 *      exactly what callers heard before this feature existed.
 *
 * Each slot is set in one of two modes:
 *   - 'text':      the admin typed the greeting; the phone system speaks it
 *                  with its text-to-speech voice.
 *   - 'recording': the admin recorded their own voice in the dashboard; the
 *                  stored audio file is what callers hear.
 * A slot counts as "set" only when its mode's value is present (non-empty
 * text, or a recording path), so a half-filled slot never shadows the
 * fallback below it.
 *
 * Storage (migration 20261125210000_voicemail_greeting_config):
 *   phone_systems.voicemail_greeting / voicemail_greeting_mode /
 *     voicemail_greeting_recording_path          — the system default slot
 *   communication_extensions.voicemail_greeting (pre-existing column) /
 *     voicemail_greeting_mode / voicemail_greeting_recording_path
 *                                                  — the per-extension slot
 * Recordings live in the private `phone-greetings` storage bucket.
 *
 * The dashboard only stores the setting. The PBX-side applier
 * (scripts/gcp/apply-voicemail-greetings.py) reads these same fields,
 * produces each mailbox's greeting audio (TTS for text mode, the converted
 * recording for recording mode), and installs it where Asterisk looks for
 * it. Until that applier runs, callers keep hearing the previous greeting.
 * Every function here treats missing columns/values as "unset", so this
 * code is safe before and after the migration lands.
 */

export type VoicemailGreetingMode = 'text' | 'recording';

export type VoicemailGreetingSlot = {
  mode: VoicemailGreetingMode;
  text: string;
  recordingPath: string;
};

export type VoicemailGreetingSlotInput = {
  mode?: unknown;
  text?: unknown;
  recordingPath?: unknown;
} | null | undefined;

export type ResolvedVoicemailGreeting =
  | { source: 'extension' | 'system'; mode: 'text'; text: string }
  | { source: 'extension' | 'system'; mode: 'recording'; recordingPath: string }
  | { source: 'none' };

/** Long enough for a full greeting, short enough to speak in ~45 seconds. */
export const VOICEMAIL_GREETING_MAX_CHARS = 600;

/** Storage bucket for dashboard-recorded greeting audio (private). */
export const VOICEMAIL_GREETING_BUCKET = 'phone-greetings';

/** Suggested system greeting, offered in the dashboard as the starting text. */
export const DEFAULT_VOICEMAIL_GREETING =
  'Thank you for calling Elevate for Humanity. We are unable to take your call right now. ' +
  'Please leave your name, callback number, and the reason for your call, and we will get back to you as soon as possible.';

export function normalizeVoicemailGreetingMode(value: unknown): VoicemailGreetingMode {
  return value === 'recording' ? 'recording' : 'text';
}

/** Normalize a stored/partial slot into a complete one (missing = unset). */
export function normalizeVoicemailGreetingSlot(
  input: VoicemailGreetingSlotInput,
): VoicemailGreetingSlot {
  return {
    mode: normalizeVoicemailGreetingMode(input?.mode),
    text: typeof input?.text === 'string' ? input.text.trim() : '',
    recordingPath: typeof input?.recordingPath === 'string' ? input.recordingPath.trim() : '',
  };
}

/** A slot only counts when the value its mode needs is actually present. */
export function voicemailGreetingSlotIsSet(slot: VoicemailGreetingSlot): boolean {
  return slot.mode === 'recording' ? slot.recordingPath.length > 0 : slot.text.length > 0;
}

/**
 * Validate greeting text for saving. Returns the cleaned text, or a
 * plain-language error describing what to fix.
 */
export function validateVoicemailGreetingText(
  value: unknown,
): { ok: true; text: string } | { ok: false; message: string } {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (text.length > VOICEMAIL_GREETING_MAX_CHARS)
    return {
      ok: false,
      message: `Keep the voicemail greeting under ${VOICEMAIL_GREETING_MAX_CHARS} characters so callers are not kept listening too long.`,
    };
  if (Array.from(text).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127))
    return { ok: false, message: 'Remove special characters from the voicemail greeting.' };
  return { ok: true, text };
}

/**
 * The greeting a mailbox should play: the extension's own slot when set,
 * otherwise the system default slot when set, otherwise none (Asterisk's
 * stock prompts — the pre-feature behavior).
 */
export function resolveVoicemailGreeting(
  extensionSlot: VoicemailGreetingSlotInput,
  systemSlot: VoicemailGreetingSlotInput,
): ResolvedVoicemailGreeting {
  const candidates: Array<['extension' | 'system', VoicemailGreetingSlot]> = [
    ['extension', normalizeVoicemailGreetingSlot(extensionSlot)],
    ['system', normalizeVoicemailGreetingSlot(systemSlot)],
  ];
  for (const [source, slot] of candidates) {
    if (!voicemailGreetingSlotIsSet(slot)) continue;
    return slot.mode === 'recording'
      ? { source, mode: 'recording', recordingPath: slot.recordingPath }
      : { source, mode: 'text', text: slot.text };
  }
  return { source: 'none' };
}

/** Map a phone_systems row (any subset of columns) to its greeting slot. */
export function systemVoicemailGreetingSlot(system: {
  voicemail_greeting?: unknown;
  voicemail_greeting_mode?: unknown;
  voicemail_greeting_recording_path?: unknown;
} | null | undefined): VoicemailGreetingSlot {
  return normalizeVoicemailGreetingSlot({
    mode: system?.voicemail_greeting_mode,
    text: system?.voicemail_greeting,
    recordingPath: system?.voicemail_greeting_recording_path,
  });
}

/** Map a communication_extensions row (any subset of columns) to its slot. */
export function extensionVoicemailGreetingSlot(extension: {
  voicemail_greeting?: unknown;
  voicemail_greeting_mode?: unknown;
  voicemail_greeting_recording_path?: unknown;
} | null | undefined): VoicemailGreetingSlot {
  return normalizeVoicemailGreetingSlot({
    mode: extension?.voicemail_greeting_mode,
    text: extension?.voicemail_greeting,
    recordingPath: extension?.voicemail_greeting_recording_path,
  });
}

/**
 * Storage path for a newly recorded greeting. `scope` is 'system' or the
 * extension's row id; the applier only ever reads the path stored on the
 * row, never a path it constructs itself.
 */
export function voicemailGreetingRecordingPath(
  scope: string,
  extension: string,
  uniqueId: string,
  fileExtension: string,
): string {
  const safeScope = /^[A-Za-z0-9-]+$/.test(scope) ? scope : 'system';
  const safeExtension = /^[0-9]{1,6}$/.test(extension) ? extension : 'unknown';
  const safeId = /^[A-Za-z0-9-]+$/.test(uniqueId) ? uniqueId : 'recording';
  const safeExt = /^[a-z0-9]{2,5}$/.test(fileExtension) ? fileExtension : 'webm';
  return `${safeScope}/${safeExtension}-${safeId}.${safeExt}`;
}
