import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Employer Portal',
  description: 'Employer dashboard, hiring, and apprenticeship management.',
};

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const cookieStore = await cookies();
  const pathname =
    headersList.get('x-pathname') ||
    cookieStore.get('__efh_pathname')?.value ||
    '/employer';

  if (pathname === '/employer') redirect('/employers');

  const { user, profile } = await requireRole(['employer', 'sponsor', 'admin', 'staff']);
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || profile.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
      }}
      role="employer"
      breadcrumbs={breadcrumbs}
    >
      {children}
    </PlatformShell>
  );
}
