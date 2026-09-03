import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StandaloneBuildPackages } from '@/components/store/StandaloneBuildPackages';

export const metadata: Metadata = {
  title: 'Standalone Website & Learning Platform Packages | Elevate Store',
  description:
    'Purchase a standalone branded website, client portal, unlimited-course builder, course runner and PARIS assistant implementation from Elevate.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/implementation-packages' },
};

export default function ImplementationPackagesPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 font-bold text-slate-700 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Link>
      </div>
      <StandaloneBuildPackages />
    </main>
  );
}
