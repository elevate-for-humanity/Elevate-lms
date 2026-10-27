import { describe, expect, it } from 'vitest';
import {
  studioUserFacingError,
  studioUserFacingToolName,
} from '../../lib/devstudio/user-facing-status';

describe('Studio user-facing status', () => {
  it('preserves actionable provider status while removing credential values', () => {
    const credential = studioUserFacingError(
      'OpenHands API 401: {"error":"NoCredentialsError","token":"secret"}',
    );
    expect(credential).toContain('OpenHands API 401');
    expect(credential).toContain('[REDACTED]');
    expect(credential).not.toMatch(/secret/i);

    const provider = studioUserFacingError('DeepSeek upstream connection failed');
    expect(provider).toBe('DeepSeek upstream connection failed');
  });

  it('explains paid inference approval without exposing its internal error code', () => {
    const message = studioUserFacingError('PAID_INFERENCE_AUTHORIZATION_REQUIRED:ai-chat');
    expect(message).toContain('needs authorization');
    expect(message).not.toContain('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
  });

  it('keeps registered tool identifiers available for diagnostics', () => {
    expect(studioUserFacingToolName('openhands.engineering')).toBe('openhands.engineering');
    expect(studioUserFacingToolName('openai.chat')).toBe('openai.chat');
    expect(studioUserFacingToolName('browser.inspect')).toBe('browser.inspect');
  });
  it.each(['Authorization: Bearer private-token', 'Authorization: Basic cHJpdmF0ZTp2YWx1ZQ==', 'Bearer private-token', 'api_key=sk-private-value', '{"password":"hidden-value"}', 'ghp_privateCredential'])('redacts credential-bearing diagnostic: %s', value => {
    const message = studioUserFacingError(value);
    expect(message).toContain('[REDACTED]');
    expect(message).not.toMatch(/private|hidden-value|cHJpdmF0ZTp2YWx1ZQ/);
  });

});
