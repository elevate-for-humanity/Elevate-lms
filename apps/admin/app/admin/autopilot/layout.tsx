import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireDevToolsAccess } from '@/lib/admin/guards';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Admin | Automation | ${PLATFORM_DEFAULTS.orgName}`,
  description: `${PLATFORM_DEFAULTS.orgName} - Career training and workforce development programs.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { role } = await requireRole(['admin', 'staff']);
  requireDevToolsAccess(role);
  return <>{children}</>;
}
