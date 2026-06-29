import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import SnapshotsClient from './SnapshotsClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Platform Snapshots | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'View and roll back platform snapshots created before migrations, deploys, and config changes.',
  robots: { index: false, follow: false },
};

export default async function SnapshotsPage() {
  await requireAdmin();
  return <SnapshotsClient />;
}
