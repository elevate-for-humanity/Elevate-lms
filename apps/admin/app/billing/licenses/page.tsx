import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminBillingLicensesRedirectPage() {
  return (
    <p className="text-slate-600">
      License records sync from SaaS subscriptions.{' '}
      <Link href="/licenses" className="text-brand-blue-600 font-semibold hover:underline">
        Open full licenses admin →
      </Link>
    </p>
  );
}
