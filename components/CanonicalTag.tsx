import { headers, cookies } from 'next/headers';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export async function CanonicalTag() {
  const headersList = await headers();
  const host = headersList.get('host') || PLATFORM_DEFAULTS.canonicalDomain;
  let pathname = headersList.get('x-pathname') || '/';
  if (pathname === '/') {
    try {
      const cs = await cookies();
      pathname = cs.get('__efh_pathname')?.value || '/';
    } catch { /* ignore */ }
  }

  const canonicalUrl = `https://${host}${pathname}`;

  return <link rel="canonical" href={canonicalUrl} />;
}
