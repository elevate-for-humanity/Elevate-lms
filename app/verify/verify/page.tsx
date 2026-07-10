export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import VerifyClient from './VerifyClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Verify Certificate',
  description: `Verify the authenticity of certificates issued by ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/verify',
  },
};

interface SearchParams {
  id?: string;
  code?: string;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialId = params.id || params.code || undefined;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-slate-900">
              {PLATFORM_DEFAULTS.orgName}
            </Link>
            <Link
              href="/verify-credentials"
              className="text-sm text-brand-orange-600 hover:text-brand-orange-700"
            >
              View All Credentials
            </Link>
          </div>
        </div>
      </header>

      <VerifyClient initialId={initialId} />
    </div>
  );
}
