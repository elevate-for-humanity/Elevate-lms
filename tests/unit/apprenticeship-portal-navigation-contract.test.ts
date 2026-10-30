import { describe, expect, it } from 'vitest';
import { ROLE_NAVIGATION } from '@/lib/navigation/navigation-config';
import { readFileSync } from 'node:fs';

describe('apprenticeship portal navigation contract', () => {
  it('keeps Host Shop operations under the dashboard or an explicitly guarded canonical page', () => {
    const items = ROLE_NAVIGATION.host_shop.flatMap((section) => section.items);
    expect(items.find((item) => item.id === 'email')?.href).toBe('/host-shop/email');
    expect(items.find((item) => item.id === 'orientation')?.href).toBe('/host-shop/orientation');
    const operational = items.filter((item) => !['dashboard', 'mou'].includes(item.id));
    const guardedPages: Record<string, string> = {
      email: '/host-shop/email',
      orientation: '/host-shop/orientation',
    };
    for (const item of operational) {
      const path = new URL(item.href, 'https://local.invalid').pathname;
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
