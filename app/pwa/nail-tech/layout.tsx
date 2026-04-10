import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Elevate Nail Tech Apprentice',
  description: 'Track your nail technician apprenticeship hours and progress toward your Indiana license.',
  manifest: '/manifest-nail-tech.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nail Tech App',
  },
};

export const viewport: Viewport = {
  themeColor: '#db2777',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function NailTechPWALayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent('/pwa/nail-tech')}`);
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt
        appName="Nail Tech Apprentice"
        appDescription="Track your hours and progress toward your Indiana Nail Technician License"
        themeColor="#db2777"
      />
    </>
  );
}
