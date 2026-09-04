import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { validateOpenHandsConversationId } from '../../../lib/devstudio/openhands/client';

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
