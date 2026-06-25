import type { Metadata, Viewport } from 'next';
import { requireAdmin } from '@/lib/auth';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

export const metadata: Metadata = {
  title: 'Elevate Admin',
  description: 'Admin dashboard — users, applications, enrollments, and programs',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Admin',
  },
};

export const viewport: Viewport = {
  themeColor: '#991b1b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function AdminPWALayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt
        appName="Elevate Admin"
        appDescription="Manage users, applications, and programs"
        themeColor="#991b1b"
      />
    </>
  );
}
