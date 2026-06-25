import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

export const metadata: Metadata = {
  title: 'Elevate Partner Shop',
  description: 'Manage your apprentices and track their training progress',
  manifest: '/manifest-shop-owner.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Shop Partner',
  },
};

export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function ShopOwnerPWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt 
        appName="Shop Partner" 
        appDescription="Manage apprentices and track training progress"
        themeColor="#1e40af"
      />
    </>
  );
}
