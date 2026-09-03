import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import ContentManagerClient from '../../content/ContentManagerClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function StudioContentPage() {
  await requireAdmin();
  return <ContentManagerClient />;
}
