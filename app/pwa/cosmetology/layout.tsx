import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Elevate Cosmetology Apprentice',
  description: 'Track your cosmetology apprenticeship hours and progress toward your Indiana license.',
  manifest: '/manifest-cosmetology.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cosmetology App',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function CosmetologyPWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent('/pwa/cosmetology')}`);
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt
        appName="Cosmetology Apprentice"
        appDescription="Track your hours and progress toward your Indiana Cosmetology License"
        themeColor="#7c3aed"
      />
    </>
  );
}
