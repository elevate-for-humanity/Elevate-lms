import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Heart, DollarSign, Users, Award, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Monthly Giving | Sustain Workforce Development',
  description:
    `Become a monthly donor and provide sustained support for career training, certifications, and job placement at ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/donate/monthly' },
};

const MONTHLY_TIERS = [
  {
    amount: 25,
    label: 'Supporter',
    impact: 'Covers study materials for one student per month',
    perks: ['Monthly impact report', 'Donor recognition'],
  },
  {
    amount: 50,
    label: 'Champion',
    impact: 'Funds certification exam fees for one student',
    perks: ['Monthly impact report', 'Donor recognition', 'Quarterly newsletter'],
    featured: true,
  },
  {
    amount: 100,
    label: 'Sustainer',
    impact: 'Sponsors a full week of training each month',
    perks: [
      'Monthly impact report',
      'Donor recognition',
      'Quarterly newsletter',
      'Annual impact call',
    ],
  },
  {
    amount: 250,
    label: 'Patron',
    impact: 'Provides full program supplies for a student cohort',
    perks: ['All Sustainer perks', 'Named scholarship opportunity', 'Site visit invitation'],
  },
];

const IMPACT_STATS = [
  { value: '20+', label: 'Training Programs' },
  { value: 'ETPL', label: 'Listed Provider' },
  { value: 'DOL', label: 'Registered Sponsor' },
  { value: 'WIOA', label: 'Funding Accepted' },
];

export default async function MonthlyDonationPage() {
  const db = await requireAdminClient();

  // Pull total donation count as social proof
  const { count: donorCount } = await db
    .from('donations')
    .select('*', { count: 'exact', head: true });

  const { count: activeEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Donate', href: '/donate' }, { label: 'Monthly Giving' }]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <RefreshCw className="w-10 h-10 text-brand-red-400 mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            Monthly Giving
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Sustain Career Transformation</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Monthly donors provide the sustained funding that keeps training programs running,
            certifications accessible, and career pathways open for Indiana workers.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="bg-brand-red-600 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-10 text-center">
          {IMPACT_STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-red-100 text-sm mt-1">{s.label}</p>
            </div>
          ))}
          {activeEnrollments && (
            <div>
              <p className="text-2xl font-extrabold text-white">{activeEnrollments}</p>
              <p className="text-red-100 text-sm mt-1">Active Students</p>
            </div>
          )}
        </div>
      </section>

      {/* Monthly tiers */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Choose Your Monthly Amount
          </h2>
          <p className="text-slate-500 text-center mb-10">
            Cancel anytime. 100% of your gift supports workforce training.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MONTHLY_TIERS.map((tier) => (
              <div
                key={tier.amount}
                className={`rounded-xl border p-6 flex flex-col ${
                  tier.featured
                    ? 'border-brand-red-500 ring-2 ring-brand-red-500 shadow-lg'
                    : 'border-slate-200'
                }`}
              >
                {tier.featured && (
                  <span className="text-xs font-bold text-brand-red-600 uppercase tracking-wide mb-2">
                    Most Popular
                  </span>
                )}
                <p className="text-3xl font-extrabold text-slate-900">
                  ${tier.amount}
                  <span className="text-base font-normal text-slate-400">/mo</span>
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-1 mb-3">{tier.label}</p>
                <p className="text-sm text-slate-600 mb-4 flex-1">{tier.impact}</p>
                <ul className="space-y-1.5 mb-5">
                  {tier.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-brand-green-500 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:donate@${PLATFORM_DEFAULTS.canonicalDomain}?subject=Monthly Donation - $${tier.amount}/month`}
                  className={`w-full text-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    tier.featured
                      ? 'bg-brand-red-600 text-white hover:bg-brand-red-700'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Give ${tier.amount}/month
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why monthly */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1">
            <Heart className="w-8 h-8 text-brand-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Why Monthly Giving Matters</h2>
            <p className="text-slate-600 mb-4">
              One-time gifts are appreciated, but monthly giving allows us to plan ahead — hiring
              instructors, ordering supplies, and keeping programs running without gaps.
            </p>
            <ul className="space-y-2">
              {[
                'Predictable funding keeps programs fully staffed',
                "Students aren't interrupted mid-program by funding gaps",
                'Allows us to expand into new credential areas',
                'Reduces administrative overhead vs. one-time campaigns',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-brand-green-500 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-64 shrink-0 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
              <DollarSign className="w-8 h-8 text-brand-red-500 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-slate-900">{donorCount ?? '—'}</p>
              <p className="text-sm text-slate-500">Total Donations Received</p>
            </div>
            <Link
              href="/donate"
              className="block text-center rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Make a one-time gift instead <ArrowRight className="inline w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold mb-3">Questions About Giving?</h2>
          <p className="text-slate-300 mb-6">
            Contact our development team to discuss corporate giving, matching gifts, or custom
            donation arrangements.
          </p>
          <a
            href="mailto:donate@elevateforhumanity.org"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white hover:bg-brand-red-700 transition"
          >
            donate@elevateforhumanity.org
          </a>
        </div>
      </section>
    </div>
  );
}
