import { OperationalPortalShell } from '@/components/platform/OperationalPortalShell';

export const dynamic = 'force-dynamic';

export default function WorkforceBoardLayout({ children }: { children: React.ReactNode }) {
  return <OperationalPortalShell portalKey="workforceboard">{children}</OperationalPortalShell>;
}
