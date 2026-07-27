import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  CheckCircle,
  ArrowRight,
  Clock,
  DollarSign,
  Award,
  Users,
  Scissors,
  Phone,
  Mail,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Program | Earn While You Learn | Elevate for Humanity',
  description:
    "Become a licensed barber through Elevate's DOL-registered apprenticeship. Earn wages while training, complete 2,000 OJT hours, and earn your Indiana Barber License.",
  alternates: { canonical: 'https://www.elevateforhumanity.org/barber-apprenticeship' },
};

const PROGRAM_HIGHLIGHTS = [
  { label: 'OJT Hours Required', value: '2,000', icon: Clock },
  { label: 'Related Technical Instruction', value: '144 hrs', icon: Award },
  { label: 'Credential Earned', value: 'Indiana Barber License', icon: Award },
  { label: 'DOL Registered', value: 'Apprenticeship', icon: CheckCircle },
];

const WHAT_YOU_LEARN = [
  'Haircutting techniques — fades, tapers, and classic cuts',
  'Shaving and beard grooming',
  'Scalp treatments and hair care',
  'Indiana State Board exam preparation',
  'Client consultation and salon business basics',
  'Sanitation, safety, and infection control',
  'Barbershop operations and customer service',
];

export default async function BarberApprenticeshipPage() {
  const db = await requireAdminClient();

  // Pull live program data
  const { data: program } = await db
    .from('programs')
    .select(
      'id, title, description, short_description, duration_weeks, tuition_cost, credential_type, status',
    )
    .eq('slug', 'barber-apprenticeship')
    .maybeSingle();

  // Pull active apprentices count
  const { count: activeApprentices } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('program_id', program?.id ?? '');

  const { count: completedApprentices } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .eq('program_id', program?.id ?? '');

  // Pull host shop locations
  const { data: hostShops } = await db
    .from('apprenticeship_host_employers')
    .select('id, business_name, city, state, accepting_apprentices')
    .eq('program_type', 'barber')
    .eq('accepting_apprentices', true)
    .order('business_name')
    .limit(6);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Programs', href: '/programs' }, { label: 'Barber Apprenticeship' }]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[400px] overflow-hidden">
        <Image
          src="/images/pages/barber-hero.webp"
          alt="Barber apprenticeship training"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-slate-900/60" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 pb-10 w-full">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-2">
              DOL Registered Apprenticeship
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Barber Apprenticeship Program
            </h1>
            <p className="text-slate-200 text-lg max-w-2xl">
              Earn wages while you train. Complete 2,000 OJT hours at a licensed barbershop and earn
              your Indiana Barber License.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-900 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-10 text-center">
          <div>
            <p className="text-3xl font-extrabold text-white">{activeApprentices ?? '—'}</p>
            <p className="text-slate-400 text-sm mt-1">Active Apprentices</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">{completedApprentices ?? '—'}</p>
            <p className="text-slate-400 text-sm mt-1">Licensed Graduates</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">2,000</p>
            <p className="text-slate-400 text-sm mt-1">OJT Hours</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">Paid</p>
            <p className="text-slate-400 text-sm mt-1">While You Train</p>
          </div>
        </div>
      </section>

      {/* Program highlights */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Program Details</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {PROGRAM_HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="rounded-xl border border-slate-200 p-6 text-center">
                  <Icon className="w-7 h-7 text-brand-red-500 mx-auto mb-3" />
                  <p className="text-xl font-extrabold text-slate-900">{h.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{h.label}</p>
                </div>
              );
            })}
          </div>

          {program?.description && (
            <p className="text-slate-700 text-lg max-w-3xl">{program.description}</p>
          )}
        </div>
      </section>

      {/* What you learn */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <Scissors className="w-8 h-8 text-brand-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-6">What You'll Learn</h2>
            <ul className="space-y-3">
              {WHAT_YOU_LEARN.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-900 mb-3">Payment Options</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Flexible weekly payment plan
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Pay in full (5% discount)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Buy now, pay later (Affirm / Sezzle)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Employer-sponsored options
                </li>
              </ul>
              <Link
                href="/programs/barber-apprenticeship/eligibility"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600 hover:underline"
              >
                See payment options <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="rounded-xl bg-brand-red-50 border border-brand-red-100 p-6">
              <DollarSign className="w-6 h-6 text-brand-red-500 mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Earn While You Train</h3>
              <p className="text-sm text-slate-600">
                Apprentices are employed by a host barbershop and earn wages throughout the program
                — no unpaid training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Host shops */}
      {hostShops && hostShops.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Host Barbershops</h2>
              <Link
                href="/programs/barber-apprenticeship/host-shops"
                className="text-sm font-semibold text-brand-red-600 hover:underline flex items-center gap-1"
              >
                All locations <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hostShops.map((shop) => (
                <div key={shop.id} className="rounded-xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">{shop.business_name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {shop.city}, {shop.state}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700">
                    Accepting Apprentices
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-between">
          <div>
            <Users className="w-8 h-8 text-brand-red-400 mb-3" />
            <h2 className="text-2xl font-bold mb-2">Apply to the Barber Apprenticeship</h2>
            <p className="text-slate-300 max-w-lg">
              Applications are reviewed on a rolling basis. Spots are limited — apply early to
              secure your placement.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              href="/programs/barber-apprenticeship/apply"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs/barber-apprenticeship/apply?type=partner_shop"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
            >
              Partner Barbershop <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="tel:+13173143757"
              className="inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition"
            >
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
