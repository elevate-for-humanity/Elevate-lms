import { describe, expect, it } from 'vitest';
import {
  studioUserFacingError,
  studioUserFacingToolName,
} from '../../lib/devstudio/user-facing-status';

describe('Studio user-facing status', () => {
  it('keeps provider brands and raw credential failures out of LIZZY', () => {
    const credential = studioUserFacingError(
      'OpenHands API 401: {"error":"NoCredentialsError","token":"secret"}',
    );
    expect(credential).toContain('selected capability is not connected');
    expect(credential).not.toMatch(/OpenHands|NoCredentialsError|secret/i);

    const provider = studioUserFacingError('DeepSeek upstream connection failed');
    expect(provider).toContain('internal AI capability');
    expect(provider).not.toContain('DeepSeek');
  });

  it('explains paid inference approval without exposing its internal error code', () => {
    const message = studioUserFacingError('PAID_INFERENCE_AUTHORIZATION_REQUIRED:ai-chat');
    expect(message).toContain('needs authorization');
    expect(message).not.toContain('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
  });

  it('uses capability labels instead of provider identities', () => {
    expect(studioUserFacingToolName('openhands.engineering')).toBe('Engineering capability');
    expect(studioUserFacingToolName('openai.chat')).toBe('AI capability');
    expect(studioUserFacingToolName('browser.inspect')).toBe('browser.inspect');
  });
});
