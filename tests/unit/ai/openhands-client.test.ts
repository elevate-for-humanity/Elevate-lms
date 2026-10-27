import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  startOpenHandsTask,
  validateOpenHandsConversationId,
} from '../../../lib/devstudio/openhands/client';

describe('OpenHands conversation identifiers', () => {
  it('accepts compact opaque identifiers returned by OpenHands Cloud', () => {
    expect(validateOpenHandsConversationId('6181d90e9fcd44b3819c4e3e23afe5ac')).toBe(
      '6181d90e9fcd44b3819c4e3e23afe5ac',
    );
  });

  it('continues to accept UUID-shaped identifiers', () => {
    expect(validateOpenHandsConversationId('e355795c-fd9f-40ab-b3b1-9903052f09ef')).toBe(
      'e355795c-fd9f-40ab-b3b1-9903052f09ef',
    );
  });

  it('rejects identifiers that could alter the request path', () => {
    expect(() => validateOpenHandsConversationId('../conversations')).toThrow(
      'OpenHands conversation id is invalid',
    );
  });
});

describe('OpenHands Cloud authentication', () => {
  it('uses the documented Bearer credential without a conflicting legacy token', async () => {
    vi.stubEnv('OPENHANDS_API_KEY', 'test-cloud-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'start-task-1', status: 'WORKING' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await startOpenHandsTask({ message: 'Audit the Store demos.' });

    const init = fetchMock.mock.calls[0]?.[1];
    const requestHeaders = new Headers(init?.headers);
    expect(requestHeaders.get('Authorization')).toBe('Bearer test-cloud-key');
    expect(requestHeaders.has('X-Access-Token')).toBe(false);

    fetchMock.mockRestore();
    vi.unstubAllEnvs();
  });
});
