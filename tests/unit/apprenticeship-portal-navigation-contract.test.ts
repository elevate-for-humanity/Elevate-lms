import { describe, expect, it } from 'vitest';
import { ROLE_NAVIGATION } from '@/lib/navigation/navigation-config';
import { readFileSync } from 'node:fs';

describe('apprenticeship portal navigation contract', () => {
  it('keeps Host Shop operations in the dashboard and its separately guarded mailbox', () => {
    const items = ROLE_NAVIGATION.host_shop.flatMap((section) => section.items);
    const operational = items.filter((item) => !['dashboard','mou'].includes(item.id));
    for (const item of operational) {
      const path = new URL(item.href, 'https://local.invalid').pathname;
      if (item.id === 'email' || item.id === 'orientation') expect(path).toBe(`/host-shop/${item.id}`);
      else expect(path).toMatch(/^\/host-shop\/dashboard\//);
    }
    for (const route of ['email', 'orientation']) {
      const source = readFileSync(`apps/lms/app/host-shop/${route}/page.tsx`, 'utf8');
      expect(source).toContain('await requireRole(HOST_SHOP_ROLES)');
      expect(source).toContain("from '@/lib/rbac/role-matrix'");
    }
  });
  it('exposes apprentice RTI, handbook, documents, and state-board evidence', () => {
    const paths = ROLE_NAVIGATION.apprentice.flatMap((section) => section.items.map((item) => new URL(item.href, 'https://local.invalid').pathname));
    expect(paths).toEqual(expect.arrayContaining(['/apprentice/rti','/apprentice/handbook','/apprentice/documents','/apprentice/state-board']));
  });
});
