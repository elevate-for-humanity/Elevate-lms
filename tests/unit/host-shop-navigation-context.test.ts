import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { getDashboardHref, getFlatNavItems } from '@/lib/navigation/navigation-config';
import { canonicalPreviewUrl } from '@/lib/admin/preview-origin';

describe('every Host Shop navigation tab keeps the current session origin', () => {
  const items = getFlatNavItems('host_shop');
  it('contains the complete Host Shop tool set exactly once', () => {
    expect(items.map(i => i.id).sort()).toEqual([
      'dashboard', 'apprentices', 'attendance', 'hours', 'practical-log',
      'match-requests', 'email', 'orientation', 'community', 'competencies',
      'wages', 'documents', 'resources', 'schedule', 'messages',
      'communications', 'phone', 'reports', 'programs', 'profile',
      'store', 'settings', 'mou',
    ].sort());
    expect(new Set(items.map(i => i.id)).size).toBe(items.length);
    expect(new Set(items.map(i => i.href)).size).toBe(items.length);
  });
  it.each(items)('$label has an existing LMS page on the same hostname', item => {
    expect(item.href.startsWith('/host-shop/')).toBe(true);
    expect(existsSync(`apps/lms/app${item.href}/page.tsx`)).toBe(true);
    for (const origin of ['https://app.elevateforhumanity.org', 'https://lms.elevateforhumanity.org']) {
      expect(new URL(item.href, origin).origin).toBe(origin);
    }
  });
  it('keeps the header Dashboard link on the same origin too', () => {
    expect(getDashboardHref('host_shop')).toBe('/host-shop/dashboard');
    expect(getDashboardHref('partner')).toBe('/host-shop/dashboard');
  });
  it('moves legacy preview POST URLs before setting host-only cookies', () => {
    const req = new Request('https://app.elevateforhumanity.org/api/admin/select-host-shop?partner_id=styles', {method:'POST',body:'handoff=opaque'});
    expect(canonicalPreviewUrl(req)?.href).toBe('https://lms.elevateforhumanity.org/api/admin/select-host-shop?partner_id=styles');
    expect(req.bodyUsed).toBe(false);
  });
  it('never redirects an already canonical preview or a custom deployment', () => {
    for (const host of ['lms.elevateforhumanity.org', 'localhost:4180', 'school.example.com']) {
      expect(canonicalPreviewUrl(new Request(`https://${host}/api/admin/select-host-shop`))).toBeNull();
    }
  });
  it('never interprets a double-slash pathname as an external redirect origin', () => {
    expect(canonicalPreviewUrl(new Request('https://app.elevateforhumanity.org//outside.example/path'))?.origin).toBe('https://lms.elevateforhumanity.org');
  });
});
