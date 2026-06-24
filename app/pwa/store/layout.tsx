import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

export const metadata: Metadata = {
  title: 'Elevate Store',
  description: 'Training materials, exam vouchers, toolkits, and program supplies',
  manifest: '/manifest-store.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Store',
  },
};

export const viewport: Viewport = {
  themeColor: '#dc2626',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StorePWALayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt
        appName="Elevate Store"
        appDescription="Browse training materials and program supplies"
        themeColor="#dc2626"
      />
    </>
  );
}
