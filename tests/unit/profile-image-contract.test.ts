import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const editor = readFileSync('components/profile/UniversalProfilePhotoEditor.tsx', 'utf8');
const action = readFileSync('lib/profile/avatar-actions.ts', 'utf8');
const resilientImage = readFileSync('components/profile/ProfileImage.tsx', 'utf8');

describe('universal dashboard profile image contract', () => {
  it('offers broad image selection including modern camera formats', () => {
    expect(editor).toContain('accept="image/*,.heic,.heif,.avif,.tif,.tiff"');
  });

  it('normalizes decoded sources to a bounded JPEG artifact', () => {
    expect(action).toContain('.resize(1200, 1200');
    expect(action).toContain('.jpeg({ quality: 88');
    expect(action).toContain("contentType: 'image/jpeg'");
  });

  it('falls back to the canonical Elevate Admin logo', () => {
    expect(resilientImage).toContain("ADMIN_LOGO_FALLBACK = '/images/logo.png'");
    expect(resilientImage).toContain('onError=');
  });
});
