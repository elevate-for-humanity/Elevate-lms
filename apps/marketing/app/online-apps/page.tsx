import type { Metadata } from 'next';
import Image from 'next/image';
import { ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';

import {
  DASHBOARD_WORKSPACES,
  PUBLIC_EXPERIENCES,
  SECURE_WORKSPACES,
  STAFF_AND_PARTNER_PORTALS,
} from '../../lib/platform-access-registry';

export const metadata: Metadata = {
  title: 'Elevate Online Apps & Portals',
  description:
    'Explore Elevate programs and platform tools, then open the secure dashboard or workspace assigned to your role.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/online-apps' },
};

export default function OnlineAppsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-rose-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-900">
              <ShieldCheck className="h-4 w-4" /> Public information + secure workspaces
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              Elevate Online Apps & Portals
            </h1>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-700">
              Explore programs and platform tools without an account. Sign in when you are ready to open your assigned dashboard, manage your account or continue authorized work.
            </p>
          </div>
          <div className="relative min-h-[260px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <Image
              src="/images/certificates-hero.webp"
              alt="Elevate online dashboards and workspaces"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
          No account required
        </p>
        <h2 className="mt-2 text-3xl font-black">Explore programs & platform tools</h2>
        <p className="mt-2 max-w-3xl font-medium text-slate-700">
          Start here to learn about a program, review platform products or compare available plans. Learner records and course progress are never exposed from this public page.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PUBLIC_EXPERIENCES.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-rose-300 hover:shadow-md"
            >
              <h3 className="font-black text-slate-950">{item.name}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                {item.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-brand-red-700">
                {item.action} <ExternalLink className="h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-blue-800">
            Login required
          </p>
          <h2 className="mt-2 text-3xl font-black">Secure workspaces</h2>
          <p className="mt-2 max-w-3xl font-medium text-slate-700">
            These tools contain account-owned settings, billing information or editable workspace data. Access requires authentication and the correct entitlement.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {SECURE_WORKSPACES.map((item) => (
              <a
                key={item.id}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                  <LockKeyhole className="h-4 w-4" /> Secure workspace
                </div>
                <h3 className="mt-3 font-black text-slate-950">{item.name}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {item.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-blue-800">
                  {item.action} <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
          Your workspace
        </p>
        <h2 className="mt-2 text-3xl font-black">Dashboards</h2>
        <p className="mt-2 max-w-3xl font-medium text-slate-700">
          Choose the dashboard that matches your relationship with Elevate. After sign-in, authorization determines which records, courses and actions you can access.
        </p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DASHBOARD_WORKSPACES.map((app) => (
            <a
              key={app.id}
              href={app.href}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                <Image
                  src={app.image!}
                  alt={`${app.name} workspace`}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h3 className="font-black text-slate-950">{app.name}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  {app.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-blue-800">
                  {app.action} <ExternalLink className="h-4 w-4" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-3xl font-black">Staff & partner portals</h2>
          <p className="mt-2 max-w-3xl font-medium text-slate-700">
            Operational portals for staff, instructors, employers, workforce partners, providers and other authorized users. Sign-in does not grant a role; the account must already have matching access.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STAFF_AND_PARTNER_PORTALS.map((portal) => (
              <a
                key={portal.id}
                href={portal.href}
                aria-label={portal.action}
                className="flex min-h-24 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 font-black text-slate-950 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span>{portal.name}</span>
                <ExternalLink className="h-4 w-4 text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
