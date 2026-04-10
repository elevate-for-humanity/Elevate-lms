import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Elevate Esthetician Apprentice',
  description: 'Track your esthetician apprenticeship hours and progress toward your Indiana license.',
  manifest: '/manifest-esthetician.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Esthetician App',
  },
};

export const viewport: Viewport = {
  themeColor: '#e11d48',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function EstheticianPWALayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent('/pwa/esthetician')}`);
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt
        appName="Esthetician Apprentice"
        appDescription="Track your hours and progress toward your Indiana Esthetician License"
        themeColor="#e11d48"
      />
    </>
  );
}
