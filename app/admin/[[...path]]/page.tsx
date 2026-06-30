import { redirect } from 'next/navigation';
import { getAdminUrl } from '@/lib/utils/siteUrl';

// Admin app catch-all — redirects to the admin app at NEXT_PUBLIC_ADMIN_URL.
// NEXT_PUBLIC_ADMIN_URL is set in the runtime environment and
// baked in at build time. Falls back to admin.elevateforhumanity.org.
export const dynamic = 'force-dynamic';

export default async function AdminCatchAll({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const devAdminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || '').trim();
  const useDevAdminUrl =
    process.env.NODE_ENV === 'development' &&
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(devAdminUrl);
  const adminBase = useDevAdminUrl ? devAdminUrl : getAdminUrl();
  const subPath = path?.length ? `/${path.join('/')}` : '/dashboard';
  redirect(`${adminBase}/admin${subPath}`);
}
