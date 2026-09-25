import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeRole, PROGRAM_HOLDER_ROLES } from '@/lib/rbac/role-matrix';
import { getRoleDestination, getRolePortalKey } from '@/lib/auth/role-destinations';
import { getNavigationRole } from '@/lib/navigation/navigation-config';

const root = process.cwd();
const source = (relative: string) => readFileSync(path.join(root, relative), 'utf8');

describe('site coordinator role contract', () => {
  it('treats site coordinators as first-class program-holder-scoped users', () => {
    expect(normalizeRole('SITE_COORDINATOR')).toBe('site_coordinator');
    expect(normalizeRole('site-coordinator')).toBe('site_coordinator');
    expect(PROGRAM_HOLDER_ROLES).toContain('site_coordinator');
    expect(getRoleDestination('site_coordinator')).toBe('/program-holder/dashboard');
    expect(getRolePortalKey('site_coordinator')).toBe('programholder');
    expect(getNavigationRole('site_coordinator')).toBe('program_holder');
  });

  it('persists the role and does not remap onboarding to Host Shop partner', () => {
    expect(source('supabase/migrations/20260925120500_site_coordinator_role.sql')).toContain(
      "'site_coordinator'",
    );
    const onboarding = source('apps/marketing/app/onboarding/start/page.tsx');
    expect(onboarding).toContain("SITE_COORDINATOR: 'site_coordinator'");
    expect(onboarding).not.toContain("SITE_COORDINATOR: 'partner'");
  });

  it('keeps shared coordinator UI free of named-person and named-region defaults', () => {
    const workspace = source('components/program-holder/ProgramHolderWorkspaceView.tsx');
    const texas = source('components/program-holder/TexasCoordinatorLaunchKit.tsx');
    expect(workspace).not.toContain('Your Gary regional queue');
    expect(workspace).not.toContain('linked to the Gary regional team');
    expect(workspace).not.toContain('compensation_per_eligible_enrollment || 1000');
    expect(texas).not.toContain('Amir Naseen');
    expect(texas).not.toContain('topacesolutions@gmail.com');
    expect(texas).not.toContain('346-295-4481');
  });
});
