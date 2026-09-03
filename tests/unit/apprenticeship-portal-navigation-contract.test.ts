import { describe, expect, it } from 'vitest';
import { ROLE_NAVIGATION } from '@/lib/navigation/navigation-config';

describe('apprenticeship portal navigation contract', () => {
  it('keeps every Host Shop operational route under the dashboard boundary', () => {
    const items = ROLE_NAVIGATION.host_shop.flatMap((section) => section.items);
    const operational = items.filter((item) => !['dashboard','mou'].includes(item.id));
    for (const item of operational) expect(new URL(item.href, 'https://local.invalid').pathname).toMatch(/^\/host-shop\/dashboard\//);
  });
  it('exposes apprentice RTI, handbook, documents, and state-board evidence', () => {
    const paths = ROLE_NAVIGATION.apprentice.flatMap((section) => section.items.map((item) => new URL(item.href, 'https://local.invalid').pathname));
    expect(paths).toEqual(expect.arrayContaining(['/apprentice/rti','/apprentice/handbook','/apprentice/documents','/apprentice/state-board']));
  });
});
