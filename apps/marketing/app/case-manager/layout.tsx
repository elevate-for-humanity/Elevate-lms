import { OperationalPortalShell } from '@/components/platform/OperationalPortalShell';

export const dynamic = 'force-dynamic';

export default function CaseManagerLayout({ children }: { children: React.ReactNode }) {
  return <OperationalPortalShell portalKey="casemanager">{children}</OperationalPortalShell>;
}
