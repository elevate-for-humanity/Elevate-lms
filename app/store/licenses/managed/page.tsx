import { redirect } from 'next/navigation';

// Legacy route — redirects to the admin licenses page
export default function LegacyManagedLicensePage({
  searchParams,
}: {
  searchParams: { reason?: string; license_id?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.reason) params.set('reason', searchParams.reason);
  if (searchParams.license_id) params.set('license_id', searchParams.license_id);
  const qs = params.toString();
  redirect(`/admin/licenses${qs ? `?${qs}` : ''}`);
}
