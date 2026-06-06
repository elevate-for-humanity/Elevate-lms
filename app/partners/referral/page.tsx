import type { Metadata } from 'next';
import Link from 'next/link';
import { loadVerifiedPublicStats } from '@/lib/site-stats-server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowRight,
  CheckCircle,
  Users,
  DollarSign,
  ClipboardList,
  Share2,
  Phone,
  Mail,
} from 'lucide-react';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Referral Partner Program | Elevate for Humanity',
  description:
    'Refer individuals to Elevate for Humanity workforce training programs. Earn referral fees, track outcomes, and help your community access funded career training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/referral' },
};

const HOW_IT_WORKS = [
  {
    n: '1',
    title: 'Submit a referral',
    desc: 'Send us a name, contact info, and the program they are interested in. Use the referral form below or call our enrollment team.',
  },
  {
    n: '2',
    title: 'We handle enrollment',
    desc: 'Our team contacts the individual, determines funding eligibility (WIOA, FSSA, WRG, self-pay), and enrolls them in the right program.',
  },
  {
    n: '3',
    title: 'Track their progress',
    desc: 'You receive confirmation when your referral enrolls and when they complete the program. No paperwork required on your end.',
  },
  {
    n: '4',
    title: 'Earn your referral fee',
    desc: 'Referral fees are paid on confirmed enrollment. Rates vary by program. Contact us to set up a referral agreement.',
  },
];

const WHO_CAN_REFER = [
  { title: 'Community Organizations', desc: 'Nonprofits, faith-based orgs, reentry programs, and social service agencies.' },
  { title: 'Healthcare Providers', desc: 'Clinics, hospitals, and social workers connecting patients to career pathways.' },
  { title: 'Workforce Case Managers', desc: 'WorkOne, FSSA, DWD, and community action agency staff.' },
  { title: 'Employers', desc: 'Companies looking to upskill current staff or pipeline new hires.' },
  { title: 'Schools & Counselors', desc: 'High school counselors, adult education programs, and community colleges.' },
  { title: 'Individuals', desc: 'Anyone who knows someone ready for a career change.' },
];

const PROGRAMS = [
  { name: 'CNA / Nursing Assistant', duration: '4 weeks', funding: 'FSSA IMPACT, WIOA', price: '$1,850' },
  { name: 'HVAC Technician', duration: '6 weeks', funding: 'WIOA, WRG', price: '$5,000' },
  { name: 'Medical Assistant', duration: '12 weeks', funding: 'WIOA, WRG', price: '$2,800' },
  { name: 'Phlebotomy Technician', duration: '4 weeks', funding: 'WIOA, FSSA', price: '$1,200' },
  { name: 'IT Help Desk', duration: '12 weeks', funding: 'WIOA, WRG', price: '$2,500' },
  { name: 'Barber Apprenticeship', duration: '18 months', funding: 'DOL Registered', price: 'Varies' },
];

export default async function ReferralPartnerPage() {
  const verified = await loadVerifiedPublicStats();
  const statsStrip = [
    { value: verified.programsDisplay, label: 'Programs available' },
    { value: '$0', label: 'Cost for funded students' },
    { value: '4 wks', label: 'Shortest program' },
    { value: '100%', label: 'Job placement support' },
  ];
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Partners', href: '/partners' },
              { label: 'Referral Program' },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Referral Partner Program
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Refer. Enroll. Earn.
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mb-8">
            Know someone ready for a career change? Refer them to Elevate for Humanity. We handle
            funding, enrollment, and training — you earn a referral fee when they enroll.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact?subject=referral-partner"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Become a Referral Partner
            </Link>
            <Link
              href="/apply/intake"
              className="border-2 border-white/30 text-white font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Submit a Referral Now
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-brand-blue-700 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {statsStrip.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-brand-blue-200 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-10">How it works</h2>
          <ol className="space-y-8">
            {HOW_IT_WORKS.map((step) => (
              <li key={step.n} className="flex gap-5">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-blue-600 text-white font-extrabold flex items-center justify-center text-lg">
                  {step.n}
                </span>
                <div>
                  <p className="font-bold text-slate-900 text-base">{step.title}</p>
                  <p className="text-slate-600 text-sm mt-1">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who can refer */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Who can refer</h2>
          <p className="text-slate-600 mb-10">
            Anyone can refer. No formal agreement required to submit a referral — a partnership
            agreement is only needed to receive referral fees.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHO_CAN_REFER.map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.title}</p>
                    <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Programs you can refer to</h2>
          <p className="text-slate-600 mb-8">
            Most programs are fully funded for eligible participants through WIOA, FSSA IMPACT, or
            the Workforce Ready Grant. Self-pay options and BNPL financing are available for
            everyone else.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Program</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Duration</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Funding</th>
                  <th className="text-left px-5 py-3 font-semibold text-slate-700">Self-pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PROGRAMS.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-5 py-3 text-slate-600">{p.duration}</td>
                    <td className="px-5 py-3 text-slate-600">{p.funding}</td>
                    <td className="px-5 py-3 text-slate-600">{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Full program list at{' '}
            <Link href="/programs" className="underline hover:text-slate-600">
              elevateforhumanity.org/programs
            </Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue-700 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-white mb-4">Ready to start referring?</h2>
          <p className="text-brand-blue-200 mb-8">
            Contact our partnerships team to set up a referral agreement, or submit a referral
            right now — no account required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/intake"
              className="bg-white text-brand-blue-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Submit a Referral
            </Link>
            <Link
              href="/contact?subject=referral-partner"
              className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" /> Contact Partnerships
            </Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center text-brand-blue-200 text-sm">
            <a href="tel:3173143757" className="flex items-center justify-center gap-2 hover:text-white transition-colors">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
            <a href="mailto:partnerships@elevateforhumanity.org" className="flex items-center justify-center gap-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" /> partnerships@elevateforhumanity.org
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
