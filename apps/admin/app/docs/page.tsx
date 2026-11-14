import { IMAGE_LOADING_BLUR } from '@/lib/ui/blur-placeholder';
import type { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/docs' },
  title: 'Document Tools | Elevate For Humanity',
  description: 'Review participant documents and open program and compliance document tools.',
};

const destinations = [
  { href: '/documents/review', title: 'Document Review', description: 'Review uploaded participant documents and their approval status.' },
  { href: '/wioa/documents', title: 'WIOA Documents', description: 'Review eligibility documents for workforce funding.' },
  { href: '/program-holder-documents', title: 'Program Holder Documents', description: 'Review documents submitted by program holders.' },
  { href: '/compliance', title: 'Compliance', description: 'Open compliance requirements and reporting tools.' },
];

export default async function DocsPage() {
  await requireRole(['admin']);
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Document Tools' }]} />
      </div>
      <section className="relative h-48 overflow-hidden md:h-64">
        <Image placeholder="blur" blurDataURL={IMAGE_LOADING_BLUR} src="/images/hero/hero-business.webp" alt="" fill className="object-cover" priority sizes="100vw" />
      </section>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">Document Tools</h1>
          <p className="mt-2 text-slate-600">Open the appropriate review workspace for each document type.</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {destinations.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl border p-6 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2">
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
        <Link href="/dashboard" className="inline-block py-3 text-sm underline">Back to Admin dashboard</Link>
      </main>
    </div>
  );
}
