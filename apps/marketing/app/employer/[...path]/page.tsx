import { redirect } from 'next/navigation';
import { PORTAL_MAP } from '@/lib/routing/portal-map';

// Marketing no longer owns employer subroutes. Preserve the requested path
// and hand authentication/authorization to the canonical LMS app.
export default async function LegacyEmployerSubroute({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const safePath = path.map((segment) => encodeURIComponent(segment)).join('/');
  redirect(`${PORTAL_MAP.employer.host}/employer/${safePath}`);
}
