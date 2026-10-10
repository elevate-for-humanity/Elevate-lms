import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const actor = vi.hoisted(() => vi.fn());
vi.mock('@/lib/communications/actor', () => ({ requireCommunicationActor: actor }));
import { phoneActorResponse } from '@/lib/phone/actor-response';
describe('phone authorization responses', () => {
  it.each([
    ['COMMUNICATIONS_UNAUTHENTICATED', 401],
    ['COMMUNICATIONS_FORBIDDEN', 403],
    ['private database failure', 503],
  ])('returns the proper failure status for %s', async (message, status) => {
    actor.mockRejectedValueOnce(new Error(message));
    const result = await phoneActorResponse();
    expect(result.actor).toBeUndefined();
    expect(result.response?.status).toBe(status);
    expect(await result.response?.text()).not.toContain(message);
  });
  it('retains the verified actor on success', async () => {
    const verified = { user: { id: 'owner' }, extension: { id: 'assigned' }, previewing: false };
    actor.mockResolvedValueOnce(verified);
    expect(await phoneActorResponse()).toEqual({ actor: verified, response: undefined });
  });
});

// Exercise the handlers too: a helper returning a Response must not be
// destructured as an authorized context by the phone settings endpoints.
vi.mock('@/lib/phone/asterisk', () => ({}));
vi.mock('@/lib/phone/webrtc', () => ({}));
vi.mock('@/lib/secrets', () => ({}));
import {
  GET as phoneGet,
  PATCH as phonePatch,
} from '@/apps/lms/app/api/program-holder/phone/route';
import { POST as tokenPost } from '@/apps/lms/app/api/program-holder/phone/token/route';
import { PATCH as inboxPatch } from '@/apps/lms/app/api/program-holder/phone/inbox/[id]/route';
import { GET as inboxRecording } from '@/apps/lms/app/api/program-holder/phone/inbox/[id]/recording/route';
import { GET as voicemailRecording } from '@/apps/lms/app/api/program-holder/phone/voicemail/[id]/recording/route';

describe('phone route authorization boundary', () => {
  it.each([
    ['COMMUNICATIONS_UNAUTHENTICATED', 401],
    ['COMMUNICATIONS_FORBIDDEN', 403],
    ['private backend failure', 503],
  ])('preserves %s on both phone context consumers', async (message, status) => {
    for (const invoke of [
      () => phoneGet(),
      () => phonePatch(new Request('https://app.example/api/phone', { method: 'PATCH' })),
    ]) {
      actor.mockRejectedValueOnce(new Error(message));
      const response = await invoke();
      expect(response.status).toBe(status);
      expect(await response.text()).not.toContain(message);
    }
  });
  it.each([
    ['token', (request: Request) => tokenPost(request)],
    [
      'inbox',
      (request: Request) => inboxPatch(request, { params: Promise.resolve({ id: 'untrusted' }) }),
    ],
    [
      'callback recording',
      (request: Request) =>
        inboxRecording(request, { params: Promise.resolve({ id: 'untrusted' }) }),
    ],
    [
      'voicemail recording',
      (request: Request) =>
        voicemailRecording(request, { params: Promise.resolve({ id: 'untrusted' }) }),
    ],
  ])('rejects signed-out %s access before database/provider work', async (_name, invoke) => {
    actor.mockRejectedValueOnce(new Error('COMMUNICATIONS_UNAUTHENTICATED'));
    expect((await invoke(new Request('https://app.example/api/phone'))).status).toBe(401);
  });
});
