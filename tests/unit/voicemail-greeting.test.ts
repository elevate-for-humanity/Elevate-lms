import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VOICEMAIL_GREETING,
  VOICEMAIL_GREETING_MAX_CHARS,
  extensionVoicemailGreetingSlot,
  normalizeVoicemailGreetingSlot,
  resolveVoicemailGreeting,
  systemVoicemailGreetingSlot,
  validateVoicemailGreetingText,
  voicemailGreetingRecordingPath,
  voicemailGreetingSlotIsSet,
} from '@/lib/phone/voicemail-greeting';

const systemText = {
  mode: 'text',
  text: 'You have reached Elevate for Humanity. Please leave a message.',
  recordingPath: '',
};
const extensionText = {
  mode: 'text',
  text: 'You have reached Elizabeth Greene. Please leave your name and number.',
  recordingPath: '',
};
const extensionRecording = {
  mode: 'recording',
  text: '',
  recordingPath: 'extensions/100-abc.webm',
};
const empty = { mode: 'text', text: '', recordingPath: '' };

describe('resolveVoicemailGreeting', () => {
  it('uses the extension typed greeting when set', () => {
    expect(resolveVoicemailGreeting(extensionText, systemText)).toEqual({
      source: 'extension',
      mode: 'text',
      text: extensionText.text,
    });
  });

  it('uses the extension recording when the extension is in recording mode', () => {
    expect(resolveVoicemailGreeting(extensionRecording, systemText)).toEqual({
      source: 'extension',
      mode: 'recording',
      recordingPath: 'extensions/100-abc.webm',
    });
  });

  it('falls back to the system greeting when the extension has none', () => {
    expect(resolveVoicemailGreeting(empty, systemText)).toEqual({
      source: 'system',
      mode: 'text',
      text: systemText.text,
    });
  });

  it('falls back to a system recording', () => {
    expect(
      resolveVoicemailGreeting(empty, {
        mode: 'recording',
        text: '',
        recordingPath: 'system/0-xyz.webm',
      }),
    ).toEqual({ source: 'system', mode: 'recording', recordingPath: 'system/0-xyz.webm' });
  });

  it('returns none when nothing is configured (stock Asterisk prompts)', () => {
    expect(resolveVoicemailGreeting(empty, empty)).toEqual({ source: 'none' });
    expect(resolveVoicemailGreeting(null, undefined)).toEqual({ source: 'none' });
  });

  it('treats whitespace-only text as unset', () => {
    expect(
      resolveVoicemailGreeting({ mode: 'text', text: '   ', recordingPath: '' }, systemText),
    ).toEqual({ source: 'system', mode: 'text', text: systemText.text });
  });

  it('a recording-mode slot without a recording does not shadow the fallback', () => {
    expect(
      resolveVoicemailGreeting(
        { mode: 'recording', text: 'Typed but not used in recording mode', recordingPath: '' },
        systemText,
      ),
    ).toEqual({ source: 'system', mode: 'text', text: systemText.text });
  });

  it('a text-mode slot ignores a stale recording path', () => {
    expect(
      resolveVoicemailGreeting(
        { mode: 'text', text: '', recordingPath: 'extensions/100-old.webm' },
        empty,
      ),
    ).toEqual({ source: 'none' });
  });
});

describe('slot normalization from database rows', () => {
  it('reads the system slot from a phone_systems row', () => {
    expect(
      systemVoicemailGreetingSlot({
        voicemail_greeting: '  Hello.  ',
        voicemail_greeting_mode: 'recording',
        voicemail_greeting_recording_path: 'system/0-a.webm',
      }),
    ).toEqual({ mode: 'recording', text: 'Hello.', recordingPath: 'system/0-a.webm' });
  });

  it('reads the extension slot from a communication_extensions row', () => {
    expect(
      extensionVoicemailGreetingSlot({
        voicemail_greeting: 'You have reached David Nazaire.',
        voicemail_greeting_mode: null,
        voicemail_greeting_recording_path: null,
      }),
    ).toEqual({
      mode: 'text',
      text: 'You have reached David Nazaire.',
      recordingPath: '',
    });
  });

  it('missing columns (pre-migration) normalize to an unset slot', () => {
    expect(systemVoicemailGreetingSlot({})).toEqual({
      mode: 'text',
      text: '',
      recordingPath: '',
    });
    expect(extensionVoicemailGreetingSlot(null)).toEqual({
      mode: 'text',
      text: '',
      recordingPath: '',
    });
    expect(voicemailGreetingSlotIsSet(normalizeVoicemailGreetingSlot(undefined))).toBe(false);
  });

  it('unknown modes fall back to text', () => {
    expect(normalizeVoicemailGreetingSlot({ mode: 'carrier-pigeon' }).mode).toBe('text');
  });
});

describe('validateVoicemailGreetingText', () => {
  it('accepts and cleans ordinary text', () => {
    expect(validateVoicemailGreetingText('  Please   leave a message. ')).toEqual({
      ok: true,
      text: 'Please leave a message.',
    });
  });

  it('accepts empty text (clears the greeting)', () => {
    expect(validateVoicemailGreetingText('')).toEqual({ ok: true, text: '' });
    expect(validateVoicemailGreetingText(null)).toEqual({ ok: true, text: '' });
  });

  it('rejects text over the cap', () => {
    const result = validateVoicemailGreetingText('a'.repeat(VOICEMAIL_GREETING_MAX_CHARS + 1));
    expect(result.ok).toBe(false);
  });

  it('rejects control characters', () => {
    expect(validateVoicemailGreetingText('Hello\u0007there').ok).toBe(false);
  });
});

describe('voicemailGreetingRecordingPath', () => {
  it('builds a scoped, sanitized path', () => {
    expect(voicemailGreetingRecordingPath('extensions', '100', 'abc-123', 'webm')).toBe(
      'extensions/100-abc-123.webm',
    );
    expect(voicemailGreetingRecordingPath('system', '0', 'def-456', 'mp4')).toBe(
      'system/0-def-456.mp4',
    );
  });

  it('never lets caller input break out of the folder shape', () => {
    expect(voicemailGreetingRecordingPath('../evil', '1;2', 'a/b', 'exe!')).toBe(
      'system/unknown-recording.webm',
    );
  });
});

describe('defaults', () => {
  it('the suggested default greeting fits the cap', () => {
    expect(DEFAULT_VOICEMAIL_GREETING.length).toBeLessThanOrEqual(VOICEMAIL_GREETING_MAX_CHARS);
    expect(validateVoicemailGreetingText(DEFAULT_VOICEMAIL_GREETING).ok).toBe(true);
  });
});
