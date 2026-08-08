import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Clock3, ShieldCheck, Users2 } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Host Shop Partnerships | Elevate for Humanity',
  description: 'Apply to become an approved apprenticeship host shop for barber, cosmetology, esthetics, and nail programs in Indiana.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/host-shop' },
};

const benefits = [
  { icon: Users2, title: 'Build your workforce', text: 'Train an apprentice inside your business with a structured on-the-job learning plan.' },
  { icon: Clock3, title: 'Digital hour tracking', text: 'Supervisors review hours, attendance, and competency progress through the host shop portal.' },
  { icon: ShieldCheck, title: 'Compliance support', text: 'Elevate manages program administration, RTI coordination, and required apprenticeship documentation.' },
  { icon: Building2, title: 'Employer partnership', text: 'Approved host shops become part of the training network and can receive matched apprentice candidates.' },
] as const;

const requirements = [
  'Indiana business/shop license in good standing for the occupation being hosted',
  'Qualified licensed supervisor or mentor available for apprentice oversight',
  'Safe physical workspace and appropriate tools/equipment',
  'Commercial liability insurance and required employment coverage',
  'Ability to verify hours, attendance, skills, and workplace progress',
  'Agreement to complete Elevate host-shop onboarding and compliance documentation',
] as const;

export default function HostShopPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-red-700">Apprenticeship Employer Network</p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">Become an approved Host Shop.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">Host shops are employers and training sites. This is separate from the apprentice/student application. Shop owners apply here, complete verification and onboarding, then supervise apprentices through the host-shop portal.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/host-shop/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700">Apply to become a Host Shop <ArrowRight className="h-5 w-5" /></Link>
              <a href="https://app.elevateforhumanity.org/host-shop/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 px-6 py-3 font-extrabold text-slate-900 hover:bg-slate-50">Existing Host Shop Login</a>
            </div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm sm:min-h-[430px]">
            <Image src="/images/pages/shop-hero.webp" alt="Licensed barbershop and salon host shop training environment" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">What Elevate and the Host Shop each do</h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">The apprentice remains enrolled in the registered apprenticeship pathway while the approved shop provides supervised on-the-job learning. Elevate coordinates the RTI, records, progress systems, and program administration.</p>
          </div>
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-red-50 text-brand-red-700"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-base leading-7 text-slate-700">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Eligibility</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Host Shop requirements</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">Submitting an application does not automatically approve a business. Elevate verifies the shop, license, supervisor, and program fit before activation.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <li key={requirement} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white sm:p-10">
          <h2 className="text-3xl font-black">Ready to host apprentices?</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">Complete the dedicated host-shop application. Apprentice enrollment uses a different workflow.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/host-shop/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700">Start Host Shop Application <ArrowRight className="h-5 w-5" /></Link>
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 px-6 py-3 font-bold text-white hover:bg-slate-900">Call {PLATFORM_DEFAULTS.supportPhone}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
