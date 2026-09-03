export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Shield,
  Users,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'Testing Center Platform | Elevate Store',
  description:
    'Commercial testing-center operations workspace for scheduling, proctor workflows, authorizations, results, and credential administration.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/testing' },
};

const features = [
  {
    icon: Calendar,
    title: 'Scheduling & seat management',
    desc: 'Coordinate testing dates, candidate slots, capacity, and appointment status.',
  },
  {
    icon: Users,
    title: 'Candidate operations',
    desc: 'Manage candidate records, eligibility, identity checks, and testing readiness.',
  },
  {
    icon: ClipboardCheck,
    title: 'Exam authorization workflows',
    desc: 'Track authorizations, outcomes, expirations, reauthorizations, and administrative actions.',
  },
  {
    icon: Shield,
    title: 'Proctor controls',
    desc: 'Support controlled testing workflows without mixing internal operations with public checkout.',
  },
  {
    icon: Award,
    title: 'Results & credential follow-through',
    desc: 'Record outcomes and keep credential-related operations tied to the candidate record.',
  },
  {
    icon: CheckCircle,
    title: 'Production route separation',
    desc: 'Commercial dashboard functions stay in Admin; candidate exam selection and payment stay on /testing.',
  },
];

export default function TestingCenterProductPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Testing Center Platform' }]} />
      </div>

      <section className="relative min-h-[440px] overflow-hidden bg-slate-100">
        <Image
          src="/images/pages/testing-page-1.webp"
          alt="Testing center operations"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
      </section>

      <section className="border-b border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-black uppercase tracking-widest text-brand-red-600">
            Commercial platform module
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
            Run testing operations without mixing them with candidate checkout.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
            This Store page demonstrates the operational Testing Center product. Candidate exam
            prices, booking, and payment live on the canonical public Testing Center so commercial
            product copy cannot accidentally become an exam charge.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={getAdminUrl('/testing')}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700"
            >
              Open Testing Dashboard <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              href="/testing"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-800 hover:bg-slate-50"
            >
              Book a credential exam <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black text-slate-950">What the module demonstrates</h2>
            <p className="mt-3 text-slate-600">
              No fake candidate counts, no invented savings, and no generic Store cart for regulated
              or provider-controlled exam fees.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <Icon className="h-7 w-7 text-brand-blue-700" />
                <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">For candidates</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Credential testing</h2>
            <p className="mt-3 text-slate-600">
              Use the public Testing Center for provider information, exact exam selection, verified
              public prices, and secure payment.
            </p>
            <Link
              href="/testing"
              className="mt-5 inline-flex items-center gap-2 font-bold text-brand-red-700 hover:underline"
            >
              Go to Testing Center <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">For operators</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Testing administration</h2>
            <p className="mt-3 text-slate-600">
              Use the Admin workspace for scheduling, authorizations, results, proctor operations,
              and testing-center administration.
            </p>
            <a
              href={getAdminUrl('/testing')}
              className="mt-5 inline-flex items-center gap-2 font-bold text-brand-blue-700 hover:underline"
            >
              Open Admin workspace <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
