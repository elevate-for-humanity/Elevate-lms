import Link from 'next/link';

export default function AdminBillingLicensesRedirectPage() {
  return (
    <p className="text-slate-600">
      License records sync from SaaS subscriptions.{' '}
      <Link href="/admin/licenses" className="text-brand-blue-600 font-semibold hover:underline">
        Open full licenses admin →
      </Link>
    </p>
  );
}
