import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import NavEditorClient from './NavEditorClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Navigation Settings | Admin | Elevate For Humanity',
  description: 'Edit the admin navigation structure.',
};

export default async function NavSettingsPage() {
  await requireRole(['super_admin']);
  return <NavEditorClient />;
}
