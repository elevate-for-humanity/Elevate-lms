import { describe, expect, it } from 'vitest';

import { parseSendGridFrom } from '@/lib/resend';

describe('SendGrid sender parsing', () => {
  it('parses a named sender', () => {
    expect(parseSendGridFrom('Elevate Support <support@elevateforhumanity.org>')).toEqual({
      name: 'Elevate Support',
      email: 'support@elevateforhumanity.org',
    });
  });

  it('preserves a plain sender address', () => {
    expect(parseSendGridFrom('support@elevateforhumanity.org')).toEqual({
      email: 'support@elevateforhumanity.org',
    });
  });

  it('does not manufacture values from malformed named senders', () => {
    expect(parseSendGridFrom('<support@elevateforhumanity.org>')).toEqual({
      email: '<support@elevateforhumanity.org>',
    });
  });
});
