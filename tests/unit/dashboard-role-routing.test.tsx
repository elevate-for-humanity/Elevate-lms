import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboardPage from '@/apps/admin/app/dashboard/page';
import { requireRole } from '@/lib/auth/require-role';
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { getAdminDashboardHeroAssets } from '@/lib/admin/dashboard/get-hero-assets';
import { redirect } from 'next/navigation';
vi.mock('@/lib/auth/require-role', () => ({ requireRole: vi.fn() }));
vi.mock('@/lib/admin/get-admin-dashboard-data', () => ({ getAdminDashboardData: vi.fn() }));
vi.mock('@/lib/admin/dashboard/get-hero-assets', () => ({ getAdminDashboardHeroAssets: vi.fn() }));
vi.mock('@/lib/admin/normalize-dashboard-data', () => ({ normalizeAdminDashboardData: (value: unknown) => value }));
vi.mock('@/components/admin/PodcastProgramGuideReview', () => ({ default: () => null }));
vi.mock('@/components/admin/dashboard/DashboardShell', () => ({ AdminDashboardContent: () => null }));
vi.mock('@/components/communications/EmailAccountNotice', () => ({ EmailAccountNotice: () => null }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((path: string) => { throw new Error('redirect:' + path); }) }));
describe('canonical dashboard role routing', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getAdminDashboardData).mockResolvedValue({} as never); vi.mocked(getAdminDashboardHeroAssets).mockResolvedValue({} as never); });
  for (const role of ['staff', 'org_admin', 'advisor']) {
    it('routes ' + role + ' before privileged reporting or assets load', async () => {
      vi.mocked(requireRole).mockResolvedValue({ effectiveRoles: [role] } as never);
      await expect(AdminDashboardPage()).rejects.toThrow('redirect:/staff-portal');
      expect(requireRole).toHaveBeenCalledWith(expect.arrayContaining(['admin', 'super_admin', role]));
      expect(getAdminDashboardData).not.toHaveBeenCalled();
      expect(getAdminDashboardHeroAssets).not.toHaveBeenCalled();
    });
  }
  for (const roles of [['admin'], ['super_admin'], ['staff', 'admin']]) {
    it('permits verified platform role ' + roles.join('/'), async () => {
      vi.mocked(requireRole).mockResolvedValue({ effectiveRoles: roles } as never);
      await AdminDashboardPage();
      expect(redirect).not.toHaveBeenCalled();
      expect(getAdminDashboardData).toHaveBeenCalledOnce();
    });
  }
});
