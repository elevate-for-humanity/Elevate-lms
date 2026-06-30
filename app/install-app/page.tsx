export const dynamic = 'force-dynamic';
// PUBLIC ROUTE: Admin PWA install page.
// No auth required — install prompt must work on fresh devices before login.
// Not linked from any navigation. Access via direct URL only.

import type { Metadata } from 'next';
import AdminInstallClient from './AdminInstallClient';

export const metadata: Metadata = {
  title: 'Install Admin App',
  robots: { index: false, follow: false },
};

export default function AdminInstallPage() {
  return <AdminInstallClient />;
}
