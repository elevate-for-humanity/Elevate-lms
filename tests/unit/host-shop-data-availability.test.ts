// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ errors: new Set<string>() }));
vi.mock('react', () => ({ cache: (fn: any) => fn }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/admin/host-shop-preview', () => ({ resolveHostShopAdminPreview: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      const rows: Record<string, any> = {
        profiles: { role: 'host_shop' },
        partner_users: [
          {
            partner_id: 'partner',
            partners: {
              id: 'partner',
              state: 'IN',
              program_type: 'cosmetology',
              programs: ['cosmetology'],
            },
          },
        ],
        shops: [{ id: 'shop', partner_id: 'partner', active: true }],
        apprentice_placements: [
          {
            id: 'placement',
            student_id: 'student',
            shop_id: 'shop',
            program_slug: 'cosmetology-apprenticeship',
            profiles: { full_name: 'Apprentice' },
          },
        ],
        program_enrollments: [
          { id: 'enrollment', user_id: 'student', program_slug: 'cosmetology-apprenticeship' },
        ],
      };
      const result = () => ({
        data: state.errors.has(table) ? null : (rows[table] ?? []),
        error: state.errors.has(table) ? { message: 'temporary failure' } : null,
      });
      const q: any = {};
      for (const method of ['select', 'eq', 'neq', 'in', 'or', 'is', 'order']) q[method] = () => q;
      q.maybeSingle = async () => result();
      q.then = (resolve: any) => Promise.resolve(result()).then(resolve);
      return q;
    },
  }),
}));
import { getHostShopBoard } from '@/lib/partner/board';
import { getHostShopReadinessItems } from '@/lib/partners/host-shop-readiness';
beforeEach(() => state.errors.clear());
it.each([
  ['apprentice_placements', 'apprentice placements'],
  ['hour_entries', 'work hours'],
  ['program_enrollments', 'program enrollments'],
  ['apprentice_competency_records', 'competency records'],
  ['partner_program_access', 'assigned programs'],
  ['partner_document_requirements', 'document requirements'],
  ['partner_documents', 'uploaded documents'],
])('surfaces %s outages throughout the shared dashboard', async (table, label) => {
  state.errors.add(table);
  const board = await getHostShopBoard('owner');
  expect(board.unavailableData).toContain(label);
  expect(getHostShopReadinessItems(board).some((item) => item.key === 'data-unavailable')).toBe(
    true,
  );
  expect(board.partner.id).toBe('partner');
});
it('does not report an outage when queries return genuine empty results', async () => {
  expect((await getHostShopBoard('owner')).unavailableData).toEqual([]);
});
