import type { Metadata } from 'next';
import Image from 'next/image';
import { ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Elevate Online Apps & Portals',
  description: 'Open Elevate learner, apprentice, host shop, program holder, admin, employer and workforce portals.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/online-apps' },
};

const INSTALLABLE_APPS = [
  {
    name: 'Learner PWA',
    description: 'Courses, assignments, progress, certificates, schedule and learner support.',
    href: 'https://app.elevateforhumanity.org/lms/dashboard',
    image: '/images/pages/training-classroom.webp',
  },
  {
    name: 'Apprentice PWA',
    description: 'OJT hours, RTI courses, competencies, documents and apprenticeship progress.',
    href: 'https://app.elevateforhumanity.org/apprentice',
    image: '/images/pages/apprenticeship-structure.webp',
  },
  {
    name: 'Host Shop PWA',
    description: 'Apprentices, hour approvals, attendance, competencies, documents and reporting.',
    href: 'https://app.elevateforhumanity.org/host-shop/dashboard',
    image: '/images/pages/barber-training.webp',
  },
  {
    name: 'Program Holder PWA',
    description: 'Programs, students, hours, documents and compliance actions.',
    href: 'https://www.elevateforhumanity.org/program-holder/dashboard',
    image: '/images/pages/business-meeting.webp',
  },
] as const;

const ROLE_PORTALS = [
  ['Admin', 'https://admin.elevateforhumanity.org/dashboard'],
  ['Employer', 'https://app.elevateforhumanity.org/employer/dashboard'],
  ['Parent', 'https://app.elevateforhumanity.org/parent-portal/dashboard'],
  ['Workforce', 'https://app.elevateforhumanity.org/workforce/dashboard'],
  ['Instructor', 'https://admin.elevateforhumanity.org/instructor/dashboard'],
  ['Staff', 'https://admin.elevateforhumanity.org/staff-portal/dashboard'],
  ['Testing Center', 'https://admin.elevateforhumanity.org/testing-center'],
  ['Workforce Board', 'https://www.elevateforhumanity.org/workforce-board/dashboard'],
  ['Case Manager', 'https://www.elevateforhumanity.org/case-manager/dashboard'],
  ['Provider', 'https://www.elevateforhumanity.org/provider/dashboard'],
] as const;

const PROOF_LINKS = [
  {
    name: 'Prestige Elevation Barber Curriculum',
    description: 'Published 144-hour RTI barber curriculum in the Elevate LMS.',
    href: 'https://app.elevateforhumanity.org/lms/courses/3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
  },
  {
    name: 'Curvature Body Sculpting — Website Builder',
    description: 'Website Builder workspace created from the Curvature storefront import.',
    href: 'https://www.elevateforhumanity.org/apps/website-builder/edit/4f36ef25-800d-48fa-a071-cf473064c22e',
  },
  {
    name: 'Elevate Store Demos',
    description: 'Interactive capability demos and subscription explanations.',
    href: 'https://www.elevateforhumanity.org/store#marketplace',
  },
] as const;

export default function OnlineAppsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-rose-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
              <ShieldCheck className="h-4 w-4" /> Secure role-based access
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Elevate Online Apps & Portals</h1>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-700">
              Choose the workspace that matches your role. Private dashboards require an authenticated account and the correct role, program, organization or partner relationship.
            </p>
          </div>
          <div className="relative min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <Image src="/images/heroes/lms-analytics.webp" alt="Elevate online platform dashboards" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">Installable apps</p>
        <h2 className="mt-2 text-3xl font-black">PWA workspaces</h2>
        <p className="mt-2 max-w-3xl font-medium text-slate-700">Open the app in your browser, sign in, then use the browser or device install option when available.</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INSTALLABLE_APPS.map((app) => (
            <a key={app.name} href={app.href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                <Image src={app.image} alt={`${app.name} dashboard`} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-slate-950 shadow-sm"><Smartphone className="h-3.5 w-3.5" /> Installable PWA</span>
              </div>
              <div className="p-5">
                <h3 className="font-black text-slate-950">{app.name}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{app.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-blue-800">Open app <ExternalLink className="h-4 w-4" /></span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-3xl font-black">Role portals</h2>
          <p className="mt-2 font-medium text-slate-700">These are operational workspaces. Access is restricted to accounts with the matching authorization.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ROLE_PORTALS.map(([name, href]) => (
              <a key={name} href={href} className="flex min-h-24 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 font-black text-slate-950 transition hover:border-blue-300 hover:bg-blue-50">
                <span>{name}</span><ExternalLink className="h-4 w-4 text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <h2 className="text-3xl font-black">Live proof & builder links</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROOF_LINKS.map((item) => (
            <a key={item.name} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-rose-300 hover:shadow-md">
              <h3 className="font-black text-slate-950">{item.name}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-brand-red-700">Open <ExternalLink className="h-4 w-4" /></span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
