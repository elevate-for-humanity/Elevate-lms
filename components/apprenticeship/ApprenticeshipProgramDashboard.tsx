import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import type { ApprenticeshipDashboardData } from '@/lib/apprenticeship/load-apprenticeship-dashboard';

export function ApprenticeshipProgramDashboard(props: ApprenticeshipDashboardData) {
  const { extras, complianceLinks, rti, ...shellProps } = props;
  return (
    <ApprenticePortalShell
      {...shellProps}
      brandSubtitle={extras.brandSubtitle}
      rti={rti}
      complianceLinks={complianceLinks}
    />
  );
}
