import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import ContentManagerClient from './ContentManagerClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Content Management | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Edit team members, training partners, and site content without code changes.',
  robots: { index: false, follow: false },
};

export default async function ContentPage() {
  await requireAdmin();
  return <ContentManagerClient />;
}
