export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Elevate Barber Apprentice',
  description: 'Track your barber apprenticeship hours and progress',
  manifest: '/manifest-barber.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Barber App',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function BarberPWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check — unauthenticated users go to login
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent('/pwa/barber')}`);
  }

  // Suspension gate — suspended/past-due accounts see the billing page
  const db = await getAdminClient();
  if (db) {
    const suspended = await checkBarberSuspension(user.id, db);
    if (suspended) {
      redirect('/billing-required');
    }
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <OfflineIndicator />
      {children}
      <InstallPrompt
        appName="Barber Apprentice"
        appDescription="Track your hours and progress toward licensure"
        themeColor="#7c3aed"
      />
    </>
  );
}
