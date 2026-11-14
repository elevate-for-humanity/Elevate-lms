import { OperationalPortalShell } from '@/components/platform/OperationalPortalShell';

export const dynamic = 'force-dynamic';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <OperationalPortalShell portalKey="provider">{children}</OperationalPortalShell>;
}
