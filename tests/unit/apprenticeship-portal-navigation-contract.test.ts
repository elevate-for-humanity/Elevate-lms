import { describe, expect, it } from 'vitest';
import { LMS_HOST } from '@/lib/routing/portal-map';
import { ROLE_NAVIGATION } from '@/lib/navigation/navigation-config';
import { readFileSync } from 'node:fs';

describe('apprenticeship portal navigation contract', () => {
  it('keeps Host Shop operations under the dashboard or an explicitly guarded canonical page', () => {
    const items = ROLE_NAVIGATION.host_shop.flatMap((section) => section.items);
    expect(new URL(items.find((item) => item.id === 'email')!.href, LMS_HOST).href).toBe(`${LMS_HOST}/host-shop/email`);
    expect(new URL(items.find((item) => item.id === 'orientation')!.href, LMS_HOST).href).toBe(`${LMS_HOST}/host-shop/orientation`);
    const operational = items.filter((item) => !['dashboard', 'mou'].includes(item.id));
    const guardedPages: Record<string, string> = {
      email: '/host-shop/email',
      orientation: '/host-shop/orientation',
    };
    for (const item of operational) {
      const destination = new URL(item.href, LMS_HOST);
      expect(destination.origin).toBe(new URL(LMS_HOST).origin);
      const path = destination.pathname;
      if (Object.hasOwn(guardedPages, item.id)) {
        expect(path).toBe(guardedPages[item.id]);
        const source = readFileSync(`apps/lms/app${path}/page.tsx`, 'utf8');
        expect(source).toContain('await requireRole(HOST_SHOP_ROLES)');
        expect(source).toContain("from '@/lib/rbac/role-matrix'");
      } else expect(path).toMatch(/^\/host-shop\/dashboard\//);
    }
  });
  it('exposes apprentice RTI, handbook, documents, and state-board evidence', () => {
    const paths = ROLE_NAVIGATION.apprentice.flatMap((section) =>
      section.items.map((item) => new URL(item.href, 'https://local.invalid').pathname),
    );
    expect(paths).toEqual(
      expect.arrayContaining([
        '/apprentice/rti',
        '/apprentice/handbook',
        '/apprentice/documents',
        '/apprentice/state-board',
      ]),
    );
  });
});
