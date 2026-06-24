export const dynamic = 'force-static';
export const revalidate = 3600;

import { redirect } from 'next/navigation';

// /store/request-license → /store/licenses
// Preserves query params (tier, preview, etc.)
export default async function RequestLicensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(`/store/licenses${qs ? `?${qs}` : ''}`);
}
