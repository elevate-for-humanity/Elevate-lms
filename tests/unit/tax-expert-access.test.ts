import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ office: vi.fn() }));
vi.mock('@/lib/tax-software/server/office-access', () => ({
  officeAccess: m.office,
  OfficeAccessError: class extends Error {
    constructor(
      public status: number,
      public code: string,
    ) {
      super(code);
    }
  },
}));
import { expertAccess } from '@/lib/tax-software/server/expert-access';
beforeEach(() =>
  m.office.mockResolvedValue({
    user: { id: 'actor', email_confirmed_at: '2026-01-01' },
    offices: [
      { id: 'active', status: 'active' },
      { id: 'pending', status: 'pending' },
    ],
    officeIds: ['active', 'pending'],
    ownedIds: ['active', 'pending'],
  }),
);
describe('professional preparation admission', () => {
  it('requires verified email in addition to the underlying MFA office check', async () => {
    m.office.mockResolvedValue({ user: { id: 'actor' }, offices: [], ownedIds: [] });
    await expect(expertAccess()).rejects.toMatchObject({ code: 'VERIFIED_EMAIL_REQUIRED' });
  });
  it('excludes onboarding offices from client-data access', async () => {
    const c = await expertAccess();
    expect(c.officeIds).toEqual(['active']);
    expect(c.ownedIds).toEqual(['active']);
  });
  it('does not turn pending onboarding into professional access', async () => {
    m.office.mockResolvedValue({
      user: { email_confirmed_at: '2026-01-01' },
      offices: [{ id: 'pending', status: 'pending' }],
      ownedIds: ['pending'],
    });
    await expect(expertAccess()).rejects.toMatchObject({ code: 'ACTIVE_OFFICE_REQUIRED' });
  });
});
