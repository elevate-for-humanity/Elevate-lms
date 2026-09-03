import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

const guardedPortals: Array<{ path: string; required: string[] }> = [
  {
    path: 'components/lms/LearnerWorkspaceLayout.tsx',
    required: ["requireRole(['student', 'learner', 'admin', 'staff'])"],
  },
  {
    path: 'apps/lms/app/employer/layout.tsx',
    required: ["requireRole(['employer', 'sponsor', 'admin', 'staff'])"],
  },
  {
    path: 'apps/lms/app/workforce/layout.tsx',
    required: ['requireRole([', "'workforce'", "'case_manager'"],
  },
  {
    path: 'apps/lms/app/apprentice/layout.tsx',
    required: ['supabase.auth.getUser()', 'resolveApprenticeProgramSlug', 'if (!privileged && !programSlug)'],
  },
  {
    path: 'apps/lms/app/host-shop/dashboard/layout.tsx',
    required: ['getMyPartnerContext()', "partner.status !== 'active'", "partner.approval_status !== 'approved'"],
  },
  {
    path: 'apps/lms/app/program-holder/dashboard/layout.tsx',
    required: ['requireProgramHolder()'],
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
    path: 'apps/marketing/app/provider/dashboard/layout.tsx',
    required: ["requireRole(['provider', 'provider_admin', 'admin', 'staff'])"],
  },
  {
    path: 'apps/marketing/app/case-manager/dashboard/layout.tsx',
    required: ['requireRole([', "'case_manager'", "'workforce_partner'"],
  },
  {
    path: 'apps/marketing/app/workforce-board/dashboard/layout.tsx',
    required: ['requireRole([', "'workforce_board'", "'government'"],
  },
  {
    path: 'apps/marketing/app/workforce/layout.tsx',
    required: ['supabase.auth.getUser()', 'ALLOWED_ROLES', "redirect('/unauthorized')"],
  },
];

describe('portal authorization boundaries', () => {
  for (const portal of guardedPortals) {
    it(`${portal.path} enforces a server-side authorization boundary`, () => {
      const source = read(portal.path);
      for (const token of portal.required) {
        expect(source, `${portal.path} must contain ${token}`).toContain(token);
      }
      expect(source).toContain('@/components/platform/PlatformShell');
    });
  }

  it('does not allow the Marketing employer portal to regress to login-only access', () => {
    const employer = read('apps/marketing/app/employer/layout.tsx');
    expect(employer).not.toContain('Only require login');
    expect(employer).not.toContain('createClient');
    expect(employer).toContain("requireRole(['employer', 'sponsor', 'admin', 'staff'])");
  });
});
