import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  ELEVATE_MEDIA_RUNTIME_KEYS,
  isElevateMediaRuntimeKey,
  validateElevateMediaUpdates,
} from '@/lib/google/elevate-media-settings';
const changes = {
  ELEVATE_MEDIA_PROVIDER: 'backblaze-b2',
  ELEVATE_MEDIA_ACCESS_KEY_ID: 'fixture-key-id',
  ELEVATE_MEDIA_SECRET_ACCESS_KEY: 'fixture-application-key',
};
describe('Google Elevate Media configuration validation', () => {
  it('recognizes only the permitted media runtime settings', () => {
    assert.equal(ELEVATE_MEDIA_RUNTIME_KEYS.length, 11);
    assert.equal(isElevateMediaRuntimeKey('ELEVATE_MEDIA_SECRET_ACCESS_KEY'), true);
    assert.equal(isElevateMediaRuntimeKey('NEXT_PUBLIC_ELEVATE_MEDIA_SECRET_ACCESS_KEY'), false);
    assert.throws(
      () => validateElevateMediaUpdates({ NORTHFLANK_API_TOKEN: 'not-allowed' }),
      /Unsupported/,
    );
  });

  it('requires both parts when rotating a credential pair', () => {
    assert.throws(
      () => validateElevateMediaUpdates({ ELEVATE_MEDIA_ACCESS_KEY_ID: 'new-id' }),
      /together/,
    );
    assert.throws(
      () => validateElevateMediaUpdates({ ELEVATE_MEDIA_SECRET_ACCESS_KEY: 'new-key' }),
      /together/,
    );
    assert.doesNotThrow(() => validateElevateMediaUpdates(changes));
  });

  it('does not replace credentials with a masked display value', () => {
    assert.throws(
      () =>
        validateElevateMediaUpdates({ ...changes, ELEVATE_MEDIA_SECRET_ACCESS_KEY: '••••••••' }),
      /Masked/,
    );
  });

  it('rejects newline and excessive-size values without echoing them', () => {
    assert.throws(
      () => validateElevateMediaUpdates({ ELEVATE_MEDIA_BUCKET: 'bad\nvalue' }),
      /Invalid/,
    );
    assert.throws(
      () => validateElevateMediaUpdates({ ELEVATE_MEDIA_BUCKET: 'a'.repeat(16_385) }),
      /Invalid/,
    );
  });
});
