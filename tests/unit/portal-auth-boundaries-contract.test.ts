import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WORKFORCE_ACCESS_ROLES } from '@/lib/workforce/records';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

const guardedPortals: Array<{ path: string; required: string[]; shellPath?: string }> = [
  {
    path: 'components/lms/LearnerWorkspaceLayout.tsx',
    required: ['requireRole([', "'student'", "'learner'", "'apprentice'", "'admin'", "'staff'"],
  },
  {
    path: 'apps/lms/app/employer/layout.tsx',
    required: ["requireRole(['employer', 'sponsor', 'admin', 'staff'])"],
  },
  {
    path: 'apps/lms/app/workforce/layout.tsx',
    required: ['requireRole(WORKFORCE_ACCESS_ROLES)', "from '@/lib/workforce/records'"],
  },
  {
    path: 'apps/lms/app/apprentice/layout.tsx',
    required: [
      'supabase.auth.getUser()',
      'resolveApprenticeProgramSlug',
      'if (!privileged && !programSlug)',
    ],
  },
  {
    path: 'apps/lms/app/host-shop/dashboard/layout.tsx',
    required: [
      'requireRole(HOST_SHOP_ROLES)',
      'getSessionUser()',
      'getHostShopBoard(user.id)',
      'HOST_SHOP_ACCESS_DENIED',
    ],
  },
  {
    path: 'apps/lms/app/program-holder/dashboard/layout.tsx',
    required: ['requireProgramHolder()'],
    shellPath: 'apps/lms/app/program-holder/layout.tsx',
  },
  {
    path: 'apps/lms/app/parent-portal/dashboard/layout.tsx',
    required: ["requireRole(['parent', 'admin', 'staff'])"],
  },
  {
    path: 'apps/marketing/app/employer/layout.tsx',
    required: ["requireRole(['employer', 'sponsor', 'admin', 'staff'])"],
  },
  {
    path: 'apps/marketing/app/provider/layout.tsx',
    required: ['OperationalPortalShell', 'portalKey="provider"'],
  },
  {
    path: 'apps/marketing/app/case-manager/layout.tsx',
    required: ['OperationalPortalShell', 'portalKey="casemanager"'],
  },
  {
    path: 'apps/marketing/app/workforce-board/layout.tsx',
    required: ['OperationalPortalShell', 'portalKey="workforceboard"'],
  },
  {
    path: 'apps/marketing/app/workforce/layout.tsx',
    required: ['supabase.auth.getUser()', 'ALLOWED_ROLES', "redirect('/unauthorized')"],
  },
];

describe('portal authorization boundaries', () => {
  it('keeps Workforce authorization on the shared explicit operational role allowlist', () => {
    expect([...WORKFORCE_ACCESS_ROLES].sort()).toEqual(
      ['admin', 'super_admin', 'staff', 'org_admin', 'case_manager', 'workforce_partner'].sort(),
    );
  });
  for (const portal of guardedPortals) {
    it(`${portal.path} enforces a server-side authorization boundary`, () => {
      const source = read(portal.path);
      for (const token of portal.required) {
        expect(source, `${portal.path} must contain ${token}`).toContain(token);
      }
      const shellSource = portal.shellPath ? read(portal.shellPath) : source;
      if (portal.shellPath) {
        expect(shellSource).toContain('requireProgramHolder({ allowPendingApproval: true })');
      }
      expect(
        shellSource.includes('@/components/platform/PlatformShell') ||
          shellSource.includes('@/components/platform/OperationalPortalShell'),
      ).toBe(true);
    });
  }

  it('does not allow the Marketing employer portal to regress to login-only access', () => {
    const employer = read('apps/marketing/app/employer/layout.tsx');
    expect(employer).not.toContain('Only require login');
    expect(employer).not.toContain('createClient');
    expect(employer).toContain("requireRole(['employer', 'sponsor', 'admin', 'staff'])");
  });
});
