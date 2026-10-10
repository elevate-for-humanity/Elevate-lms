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
