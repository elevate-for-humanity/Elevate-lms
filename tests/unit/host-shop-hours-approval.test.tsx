import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  board: vi.fn(),
  admin: vi.fn(),
  update: vi.fn(),
  lookup: vi.fn(),
}));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.auth }));
vi.mock('@/lib/partner/board', () => ({ getHostShopBoard: mocks.board }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import PendingHoursPage from '@/apps/lms/app/host-shop/dashboard/hours/pending/page';
const hour = {
  id: 'entry',
  user_id: 'student',
  host_shop_id: 'shop',
  program_slug: 'cosmetology-apprenticeship',
  hours_claimed: 8,
  status: 'pending',
  approval_status: 'pending',
};
function findAction(node: ReactNode): (data: FormData) => Promise<void> {
  let action: ((data: FormData) => Promise<void>) | undefined;
  function visit(n: ReactNode) {
    Children.forEach(n, (child) => {
      if (!isValidElement(child)) return;
      const element = child as ReactElement<{
        action?: (data: FormData) => Promise<void>;
        children?: ReactNode;
      }>;
      if (element.type === 'form' && !action) action = element.props.action;
      if (!action) visit(element.props.children);
    });
  }
  visit(node);
  if (!action) throw new Error('No approval form rendered');
  return action;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: 'supervisor', email: 'host@example.test' },
    effectiveRoles: ['host_shop'],
  });
  mocks.board.mockResolvedValue({
    partner: { name: 'Assigned salon' },
    shops: [{ id: 'shop' }],
    apprentices: [
      {
        student_id: 'student',
        shop_id: 'shop',
        program_slug: 'cosmetology-apprenticeship',
        name: 'Apprentice',
      },
    ],
  });
  mocks.lookup.mockResolvedValue({ data: hour, error: null });
  mocks.update.mockImplementation((values) => {
    // Same role contract as the live enforce_hour_entry_status_rules trigger.
    if (!['employer', 'sponsor', 'admin'].includes(values.approved_by_role))
      throw new Error('Invalid database verifier role');
    return chain({ data: [{ id: 'entry' }], error: null });
  });
  mocks.admin.mockResolvedValue({
    from: () => ({ select: () => chain({ data: [hour], error: null }), update: mocks.update }),
  });
});
function chain(result: object) {
  const builder: Record<string, unknown> = {};
  for (const name of ['in', 'eq', 'order', 'select']) builder[name] = () => builder;
  builder.maybeSingle = mocks.lookup;
  builder.then = (resolve: (value: object) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}
async function approve() {
  const action = findAction(await PendingHoursPage());
  const form = new FormData();
  form.set('hourId', 'entry');
  await action(form);
}
describe('Host Shop attendance approval', () => {
  it('persists the database-supported employer role and real supervisor identity', async () => {
    await approve();
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        approved_by_role: 'employer',
        approved_by_user_id: 'supervisor',
        accepted_hours: 8,
        status: 'approved',
      }),
    );
  });
  it('keeps administrator approval authority', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: 'admin', email: 'admin@example.test' },
      effectiveRoles: ['admin'],
    });
    await approve();
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ approved_by_role: 'admin' }),
    );
  });
  it('rejects an entry from another shop before mutation', async () => {
    mocks.lookup.mockResolvedValue({ data: { ...hour, host_shop_id: 'other-shop' }, error: null });
    await expect(approve()).rejects.toThrow('HOUR_ENTRY_NOT_AUTHORIZED');
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('preserves the assigned barber supervisor requirement', async () => {
    mocks.lookup.mockResolvedValue({
      data: { ...hour, program_slug: 'barber-apprenticeship' },
      error: null,
    });
    mocks.board.mockResolvedValue({
      partner: {},
      shops: [{ id: 'shop' }],
      apprentices: [
        { student_id: 'student', shop_id: 'shop', supervisor_user_id: 'another-supervisor' },
      ],
    });
    await expect(approve()).rejects.toThrow('BARBER_SUPERVISOR_REQUIRED');
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
