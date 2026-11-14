import { describe, expect, it } from 'vitest';
import { resolveStudioPreviewUrl } from '@/lib/devstudio/preview-target-url';

describe('embedded Studio deployment targets', () => {
  it.each([
    'https://admin.elevateforhumanity.org',
    'https://paris-acceptance---admin-abc-uc.a.run.app',
    'http://localhost:3000',
  ])('keeps internal tools and their conversation on %s', (origin) => {
    const route = '/studio/repository?embedded=studio&studioConversationId=conversation-1#files';
    const url = new URL(resolveStudioPreviewUrl(route, origin));
    expect(url.origin).toBe(origin);
    expect(url.pathname).toBe('/studio/repository');
    expect(url.searchParams.get('studioConversationId')).toBe('conversation-1');
    expect(url.searchParams.get('embedded')).toBe('studio');
    expect(url.hash).toBe('#files');
  });
  it('preserves explicitly selected external preview URLs', () => {
    expect(resolveStudioPreviewUrl('https://www.elevateforhumanity.org/programs', 'https://preview.test'))
      .toBe('https://www.elevateforhumanity.org/programs');
  });
  it.each(['//other.test/path', 'javascript:alert(1)', 'data:text/html,test', ''])('rejects ambiguous or non-web targets: %s', (target) => {
    expect(resolveStudioPreviewUrl(target, 'https://preview.test')).toBe('');
  });
});
