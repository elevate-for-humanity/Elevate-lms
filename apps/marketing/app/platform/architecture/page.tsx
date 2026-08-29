import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ComplianceBar } from '@/components/ComplianceBar';

export const metadata: Metadata = {
  title: 'Platform Architecture,
  description: 'Technical architecture for the Elevate for Humanity workforce platform across Marketing, LMS, Admin, Supabase, Stripe, and Northflank.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/architecture' },
};

const SERVICE_SURFACES = [
  {
    title: 'Marketing',
    host: 'www.elevateforhumanity.org',
    description: 'Public programs, applications, funding information, provider/case-manager surfaces, store, and public support experiences.',
  },
  {
    title: 'LMS & Portals',
    host: 'app.elevateforhumanity.org',
    description: 'Learner, apprentice, employer, host-shop, parent, and workforce portal experiences.',
  },
  {
    title: 'Administration',
    host: 'admin.elevateforhumanity.org',
    description: 'Administrative operations, testing-center controls, reporting, Studio, system health, and protected staff workflows.',
  },
];

const STACK = [
  ['Application framework', 'Next.js 15 + React 19 + TypeScript'],
  ['Database & identity', 'Supabase PostgreSQL, Auth, Storage, and Row Level Security'],
  ['Payments', 'Stripe Checkout, subscriptions, and webhook-backed payment workflows'],
  ['Deployment', 'Northflank multi-container services for Marketing, LMS, and Admin'],
  ['Package/runtime', 'pnpm workspace + Node.js 22'],
  ['Access control', 'Server-side role normalization, protected portal routes, and database RLS'],
];

export default function ArchitecturePage() {
  return (
    <main className="bg-white text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Architecture' }]} />
      </div>
      <ComplianceBar />

      <section className="border-y border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Production architecture</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Three application surfaces, one workforce operating platform.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Elevate separates public marketing, learner/partner portals, and protected administration into independently deployable services while sharing the same canonical data and identity infrastructure.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Application boundaries</h2>
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {SERVICE_SURFACES.map((surface) => (
              <article key={surface.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">{surface.title}</h3>
                <p className="mt-2 font-mono text-xs font-semibold text-brand-blue-700">{surface.host}</p>
                <p className="mt-4 text-sm leading-6 text-slate-700">{surface.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Current production stack</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {STACK.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-2 font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="text-2xl font-black">Data and security model</h2>
          <p className="mt-4 leading-7 text-slate-700">
            Authentication is resolved server-side before protected portal operations. Tenant- and user-scoped records are additionally constrained with Supabase Row Level Security. Privileged administrative operations use explicit server guards and service-role access only after authorization checks.
          </p>
          <p className="mt-4 leading-7 text-slate-700">
            Public program, application, apprenticeship, testing, payment, and portal routes are maintained as separate contracts so public pages do not become accidental back doors into LMS or Admin functionality.
          </p>
        </div>
      </section>
    </main>
  );
}
