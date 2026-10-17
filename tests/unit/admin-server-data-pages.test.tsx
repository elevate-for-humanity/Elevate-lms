import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ role: vi.fn(), admin: vi.fn(), browserClient: vi.fn(), tables: vi.fn() }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.role }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.browserClient }));
vi.mock('@/apps/admin/app/modules/modules-table', () => ({ ModulesTable: () => null }));
import ModulesPage from '@/apps/admin/app/modules/page';
import StorePage from '@/apps/admin/app/store/page';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.role.mockResolvedValue({ profile: { role: 'admin' } });
  mocks.browserClient.mockImplementation(() => { throw new Error('Private tables cannot use the browser-session client'); });
  mocks.tables.mockImplementation(() => {
    const query: Record<string, unknown> = {};
    for (const method of ['select', 'order', 'limit', 'eq']) query[method] = () => query;
    query.then = (resolve: (value: unknown) => unknown) => resolve({ data: [], count: 0, error: null });
    return query;
  });
  mocks.admin.mockResolvedValue({ from: mocks.tables });
});

describe.each([['Modules', ModulesPage], ['Store', StorePage]] as const)('%s private data boundary', (_name, page) => {
  it('denies unauthorized access before obtaining the privileged database client', async () => {
    mocks.role.mockRejectedValue(new Error('Unauthorized'));
    await expect(page()).rejects.toThrow('Unauthorized');
    expect(mocks.admin).not.toHaveBeenCalled();
    expect(mocks.tables).not.toHaveBeenCalled();
  });

  it('loads authorized Admin data through the existing server backend', async () => {
    await page();
    expect(mocks.role).toHaveBeenCalledWith(['admin']);
    expect(mocks.role.mock.invocationCallOrder[0]).toBeLessThan(mocks.admin.mock.invocationCallOrder[0]);
    expect(mocks.admin).toHaveBeenCalledOnce();
    expect(mocks.tables).toHaveBeenCalled();
    expect(mocks.browserClient).not.toHaveBeenCalled();
  });
});
