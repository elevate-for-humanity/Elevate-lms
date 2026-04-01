import { redirect } from 'next/navigation';

// /store/request-license → /store/licenses
// Preserves query params (tier, preview, etc.)
export default function RequestLicensePage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams(searchParams as Record<string, string>);
  const qs = params.toString();
  redirect(`/store/licenses${qs ? `?${qs}` : ''}`);
}
