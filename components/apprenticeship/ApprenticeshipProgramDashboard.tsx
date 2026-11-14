import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { ApprenticeEnrollmentGate } from '@/components/apprenticeship/ApprenticeEnrollmentGate';
import type { ApprenticeshipDashboardData } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export function ApprenticeshipProgramDashboard(props: ApprenticeshipDashboardData) {
  const { extras, complianceLinks, rti, enrollment, billing, config, ...shellProps } = props;

  if (!enrollment && !billing) {
    return (
      <ApprenticeEnrollmentGate
        programSlug={config.programSlug}
        label={config.label}
        portalPath={config.portalPath}
      />
    );
  }

  return (
    <ApprenticePortalShell
      {...shellProps}
      config={config}
      enrollment={enrollment}
      billing={billing}
      rti={rti}
    />
  );
}
