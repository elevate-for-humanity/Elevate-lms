import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('apprenticeship entry surfaces', () => {
  it('uses the apprentice root as the runtime destination without a redirect page', () => {
    const portalMap = readFileSync('lib/routing/portal-map.ts', 'utf8');
    const theoryPolicy = readFileSync(
      'components/programs/beauty/BeautyTheoryDailyPolicy.tsx',
      'utf8',
    );
    const avatarActions = readFileSync('lib/profile/avatar-actions.ts', 'utf8');
    const legacyDashboard = readFileSync('apps/lms/app/apprentice/dashboard/page.tsx', 'utf8');

    expect(portalMap).toContain("defaultPath: '/apprentice'");
    expect(theoryPolicy).toContain('https://app.elevateforhumanity.org/apprentice');
    expect(theoryPolicy).not.toContain('/apprentice/dashboard');
    expect(avatarActions).toContain("revalidatePath('/apprentice')");
    expect(avatarActions).not.toContain("revalidatePath('/apprentice/dashboard')");
    expect(legacyDashboard).toContain("import ApprenticePortalPage from '../page'");
    expect(legacyDashboard).toContain('export default ApprenticePortalPage');
    expect(legacyDashboard).not.toContain("redirect('/apprentice')");
  });

  it('shows the cosmetology hero before the enrollment promotion', () => {
    const page = readFileSync(
      'apps/marketing/app/programs/cosmetology-apprenticeship/page.tsx',
      'utf8',
    );
    expect(page).toContain('heroOverride={<CosmetologyVisualExperience />}');
    expect(page).toContain('afterHero={<BeautyEnrollmentPromotion />}');
    expect(page.indexOf('heroOverride={<CosmetologyVisualExperience />}')).toBeLessThan(
      page.indexOf('afterHero={<BeautyEnrollmentPromotion />}'),
    );
  });

  it('keeps applicant and Host Site choices usable at narrow widths', () => {
    const choice = readFileSync('components/apply/BeautyApplicationChoice.tsx', 'utf8');
    const hostForm = readFileSync('apps/marketing/app/partners/host-shop/apply/page.tsx', 'utf8');

    expect(choice).toContain('Apply as a Host Salon or Shop');
    expect(choice).toContain('overflow-x-hidden');
    expect(hostForm).toContain('overflow-x-hidden');
    expect(hostForm).toContain('w-full min-w-0 max-w-full');
    expect(hostForm).toContain('file:max-w-full');
  });
});
