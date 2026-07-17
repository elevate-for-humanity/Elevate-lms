import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import SocialMediaSettingsClient from './SocialMediaSettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Social Media Accounts | Admin' };

export default async function SocialMediaSettingsPage() {
  await requireRole(['admin', 'super_admin']);
  return <SocialMediaSettingsClient />;
}
