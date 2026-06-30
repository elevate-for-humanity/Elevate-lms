import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Building2, ClipboardCheck, Users, BookOpen,
  ShieldCheck, ArrowRight, CheckCircle, FileText,
} from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Run a Program with Elevate | Training Providers & Program Holders',
  description:
    `Partner with ${PLATFORM_DEFAULTS.orgName} to deliver workforce training. Whether you run a barbershop, cosmetology school, employer training site, or community org — here is how to get started.`,
};

// ── Two distinct roles ────────────────────────────────────────────────────────
//
// PROGRAM HOLDER  — an organization that hosts and runs training on the ground.
//   Examples: barbershop, cosmetology school, employer site, community org.
//   They sign an MOU, manage attendance, and have a portal.
//
// TRAINING PROVIDER — an org that delivers curriculum and holds credential
//   authority (NHA, EPA, DOL). Elevate is the primary provider; partners can
//   co-deliver under Elevate's credential umbrella.
//
// Most applicants are Program Holders. Training Providers go through a separate
// vetting process for credential authority.

const PROGRAM_HOLDER_STEPS = [
  { icon: FileText,      label: 'Apply',          desc: 'Submit the program holder application — org info, location, program type.' },
  { icon: ShieldCheck,   label: 'Verify',         desc: 'Identity and org verification. Typically 3–5 business days.' },
  { icon: ClipboardCheck,label: 'Sign MOU',       desc: 'Review and sign the Memorandum of Understanding.' },
  { icon: BookOpen,      label: 'Onboard',        desc: 'Complete orientation, upload required documents, set up your portal.' },
  { icon: Users,         label: 'Launch',         desc: 'Enroll learners, track attendance, and submit compliance reports.' },
];

const WHAT_YOU_GET = [
  'Access to Elevate\'s curriculum library and LMS',
  'DOL-registered apprenticeship framework',
  'Credential authority under Elevate\'s NHA and EPA agreements',
  'Compliance reporting tools (WIOA, FSSA, JRI)',
  'Dedicated program holder portal',
  'Instructor support and professional development',
  'Marketing and enrollment support',
];

const WHO_APPLIES = [
  { label: 'Barbershops & Salons',       desc: 'Host DOL-registered barber or cosmetology apprentices.' },
  { label: 'Employers',                  desc: 'Run on-the-job training or apprenticeship programs for your workforce.' },
  { label: 'Community Organizations',    desc: 'Deliver workforce training to your community with Elevate\'s curriculum.' },
  { label: 'Healthcare Facilities',      desc: 'Train CNAs, QMAs, or peer recovery specialists on-site.' },
  { label: 'Workforce Agencies',         desc: 'Refer and co-enroll WIOA, FSSA, or JRI participants.' },
  { label: 'Training Organizations',     desc: 'Co-deliver curriculum under Elevate\'s credential authority.' },
];

export default function ForProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Run a Program' }]}
            className="mb-6 text-slate-400 [&_a]:text-slate-400 [&_a:hover]:text-white"
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
            Run a workforce program with Elevate
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-8">
            Partner with us to deliver training at your location — barbershop, employer site,
            community org, or healthcare facility. We provide the curriculum, credentials,
            compliance tools, and LMS. You run the program.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/apply/program-holder"
              className="bg-brand-blue-500 hover:bg-brand-blue-400 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              Apply as a Program Holder
            </Link>
            <Link
              href="/partners/apply"
              className="border border-slate-500 hover:border-white text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              Other Partnership Types
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* Who this is for */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Who this is for</h2>
          <p className="text-slate-500 mb-8">
            Any organization that wants to host or deliver workforce training under Elevate's
            credential and compliance framework.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHO_APPLIES.map(({ label, desc }) => (
              <div key={label} className="border rounded-xl p-5">
                <p className="font-semibold text-slate-900 mb-1">{label}</p>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two roles explained */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Two ways to partner</h2>
          <p className="text-slate-500 mb-8">
            Most organizations apply as a <strong>Program Holder</strong>. Training Providers
            are orgs that also hold credential authority — a separate vetting process.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-brand-blue-500 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Program Holder</p>
                  <p className="text-xs text-brand-blue-600 font-medium">Most common</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                You host and run training at your location. Elevate provides the curriculum,
                credentials, and compliance framework. You manage attendance and learner progress
                through your portal.
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {['Sign an MOU with Elevate', 'Access the program holder portal', 'Enroll learners under Elevate\'s credential', 'Submit compliance reports (WIOA, FSSA, JRI)'].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-blue-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/apply/program-holder"
                className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-800"
              >
                Apply as a Program Holder <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Training Provider</p>
                  <p className="text-xs text-slate-500 font-medium">Credential authority required</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                You deliver curriculum and hold your own credential authority (NHA, EPA, DOL).
                You operate under Elevate's compliance framework but maintain independent
                credentialing relationships.
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                {['Existing credential authority (NHA, EPA, or DOL)', 'Qualified instructors on staff', 'Compliance history review', 'Co-delivery agreement with Elevate'].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/partners/apply"
                className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Apply as a Training Provider <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* What you get */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What you get</h2>
          <p className="text-slate-500 mb-6">Everything included for program holders.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WHAT_YOU_GET.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-brand-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How it works</h2>
          <p className="text-slate-500 mb-8">From application to first enrolled learner.</p>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />
            <div className="space-y-6">
              {PROGRAM_HOLDER_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 relative z-10">
                    {i + 1}
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold text-slate-900">{step.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-blue-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-brand-blue-100 mb-6 max-w-xl mx-auto">
            Most organizations are up and running within 2–3 weeks of submitting their application.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/apply/program-holder"
              className="bg-white text-brand-blue-700 hover:bg-brand-blue-50 px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              Apply as a Program Holder
            </Link>
            <Link
              href="/schedule"
              className="border border-brand-blue-300 hover:border-white text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              Schedule a Conversation
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
