import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, BarChart3, Users, BookOpen, Download } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Operate Workforce Programs',
  description:
    'A complete workforce operating system for agencies, employers, and partners to deliver training, track outcomes, and meet compliance requirements — without building the infrastructure.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/program-holder' },
};

export default function ProgramHolderPage() {
  return (
    <main className="bg-white">
      {/* SECTION 1: POSITIONING */}
      <section className="bg-slate-950 py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-5">
            For Agencies · Employers · Partners
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Operate Workforce Programs Without Building the Infrastructure
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto mb-10">
            Elevate provides a complete workforce operating system for agencies, employers, and
            partners to deliver training, track outcomes, and meet compliance requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?subject=platform-demo"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-extrabold px-10 py-4 rounded-xl transition-colors text-sm"
            >
              Request a Demo
            </Link>
            <Link
              href="#how-it-works"
              className="border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white font-extrabold px-10 py-4 rounded-xl transition-colors text-sm"
            >
              View How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHO THIS IS FOR */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center mb-3">
            Built for Organizations Responsible for Outcomes
          </h2>
          <p className="text-slate-400 text-sm text-center mb-10">
            If you are responsible for enrollment, performance, or placement — this system is built
            for you.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Workforce Development Boards',
                detail:
                  'Track participant outcomes, manage WIOA compliance, and report to funders including DWD and WorkOne.',
              },
              {
                label: 'State & Local Agencies',
                detail:
                  'Deploy programs at scale with audit-ready records, FSSA IMPACT eligibility tracking, and performance dashboards.',
              },
              {
                label: 'Training Providers & Institutions',
                detail:
                  'Run credentialed programs on proven infrastructure without building your own LMS or compliance stack.',
              },
              {
                label: 'Employers & Industry Partners',
                detail:
                  'Sponsor apprenticeships, manage OJT agreements, and access a trained talent pipeline through Indiana Career Connect.',
              },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-extrabold text-sm mb-2">{item.label}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT YOU GET */}
      <section className="bg-white py-20 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-3">
            Everything Required to Operate a Workforce Program
          </h2>
          <p className="text-slate-500 text-sm text-center max-w-xl mx-auto mb-14">
            Four operational categories. No gaps.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                Icon: BookOpen,
                title: 'Program Delivery',
                items: [
                  'Structured training pathways',
                  'Progress tracking and checkpoints',
                  'Credential alignment',
                ],
              },
              {
                Icon: Users,
                title: 'Participant Management',
                items: [
                  'Enrollment and intake workflows',
                  'Case management tools',
                  'Status and progress visibility',
                ],
              },
              {
                Icon: BarChart3,
                title: 'Compliance & Reporting',
                items: ['WIOA-aligned tracking', 'Audit-ready records', 'Performance dashboards'],
              },
              {
                Icon: ShieldCheck,
                title: 'Employer & Placement Integration',
                items: [
                  'Employer connections via Indiana Career Connect',
                  'Placement tracking and wage outcomes',
                  'Outcome reporting for DWD and WorkOne',
                ],
              },
            ].map((block) => (
              <div key={block.title} className="border border-slate-200 rounded-xl p-7">
                <div className="flex items-center gap-3 mb-5">
                  <block.Icon className="w-5 h-5 text-brand-red-600 shrink-0" />
                  <h3 className="font-extrabold text-slate-900 text-base">{block.title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-slate-600 text-sm">
                      <span className="text-brand-red-500 font-black mt-0.5 shrink-0">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section id="how-it-works" className="bg-slate-950 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-3">
            From Intake to Placement — Managed in One System
          </h2>
          <p className="text-slate-400 text-sm text-center max-w-xl mx-auto mb-14">
            Agencies need to see the full lifecycle. Here it is.
          </p>
          <div className="space-y-3">
            {[
              {
                n: '01',
                label: 'Intake & Eligibility',
                detail:
                  'Participants apply and are matched with funding pathways — WIOA, Workforce Ready Grant, FSSA IMPACT, or employer-sponsored.',
              },
              {
                n: '02',
                label: 'Enrollment & Program Assignment',
                detail:
                  'Participants enrolled with IEP alignment and funding documentation. WorkOne referrals processed directly.',
              },
              {
                n: '03',
                label: 'Training & Progress Tracking',
                detail:
                  'Structured programs with lesson delivery, checkpoint assessments, and attendance logging.',
              },
              {
                n: '04',
                label: 'Credentialing & Verification',
                detail:
                  'Industry certifications issued and publicly verifiable. DOL-aligned credential records.',
              },
              {
                n: '05',
                label: 'Employer Placement',
                detail:
                  'Direct connection to employer opportunities via Indiana Career Connect. OJT agreements, WEX placements, and wage tracking.',
              },
              {
                n: '06',
                label: 'Reporting & Compliance',
                detail:
                  'Real-time dashboards for agencies and partners. RAPIDS-compatible exports. DWD and WorkOne submission ready.',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-5 bg-slate-900 border border-slate-800 rounded-xl px-6 py-5"
              >
                <span className="text-brand-red-400 font-black text-xs tracking-widest shrink-0 mt-0.5">
                  {step.n}
                </span>
                <div>
                  <p className="text-white font-extrabold text-sm mb-1">{step.label}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY AGENCIES SWITCH */}
      <section className="bg-white py-16 px-6 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Why Agencies Use Elevate
          </h2>
          <div className="space-y-4">
            {[
              'Eliminate fragmented systems and spreadsheets',
              'Track participant outcomes in real time',
              'Maintain compliance without manual processes',
              'Deploy programs without building internal infrastructure',
              'Connect participants to employers through Indiana Career Connect',
              'Document FSSA IMPACT, WIOA, and WorkOne referrals in one place',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 border border-slate-200 rounded-xl px-6 py-4"
              >
                <span className="w-2 h-2 rounded-full bg-brand-red-600 shrink-0" />
                <p className="text-slate-900 font-semibold text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: COMPLIANCE */}
      <section className="bg-slate-950 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ShieldCheck className="w-8 h-8 text-brand-red-400 mx-auto mb-5" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-10">
            Designed for Workforce Compliance
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              'DOL Registered Apprenticeship Sponsor',
              'ETPL-Aligned Program Structure',
              'WIOA Performance Tracking',
              'Secure, Role-Based Access & Audit Trails',
            ].map((item) => (
              <div key={item} className="border-2 border-brand-red-600 rounded-xl px-5 py-5">
                <p className="text-white font-extrabold text-sm leading-snug">{item}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                label: 'FSSA IMPACT',
                detail:
                  'SNAP and TANF recipients trained at no cost. Elevate is a participating provider. Eligibility verified at intake.',
              },
              {
                label: 'WorkOne Integration',
                detail:
                  'Case managers refer clients directly. Progress visible in real time without manual updates or phone calls.',
              },
              {
                label: 'Indiana Career Connect',
                detail:
                  "Graduates posted to Indiana's official workforce portal. Employer connections and job matching built in.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-5 text-left"
              >
                <p className="text-brand-red-400 font-extrabold text-xs uppercase tracking-widest mb-2">
                  {item.label}
                </p>
                <p className="text-slate-300 text-xs leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: DEPLOYMENT OPTIONS */}
      <section className="bg-white py-20 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-3">
            Flexible Deployment
          </h2>
          <p className="text-slate-500 text-sm text-center max-w-xl mx-auto mb-12">
            Three options. No lock-in on the wrong tier.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                label: 'Managed Platform',
                detail:
                  'We host and manage the system while you operate programs. Fastest path to deployment.',
                tag: 'Most common',
                highlight: true,
              },
              {
                label: 'Branded Deployment',
                detail: 'Run programs under your organization with custom branding and portals.',
                tag: 'For partners',
                highlight: false,
              },
              {
                label: 'Enterprise / Source Access',
                detail: 'Full control for large-scale or state-level implementations.',
                tag: 'For scale',
                highlight: false,
              },
            ].map((option) => (
              <div
                key={option.label}
                className={`rounded-xl p-7 border-2 flex flex-col ${option.highlight ? 'border-brand-red-600 bg-brand-red-50' : 'border-slate-200 bg-white'}`}
              >
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ${option.highlight ? 'text-brand-red-600' : 'text-slate-400'}`}
                >
                  {option.tag}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mb-3">{option.label}</h3>
                <p className="text-slate-600 text-xs leading-relaxed flex-1">{option.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: CLOSE */}
      <section className="bg-slate-950 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-5 leading-tight">
            See How It Works in Your Environment
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-10 max-w-xl mx-auto">
            We will walk through how the system supports your programs, compliance requirements, and
            reporting needs — including WIOA, FSSA IMPACT, WorkOne referrals, and Indiana Career
            Connect integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?subject=platform-demo"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-extrabold px-10 py-4 rounded-xl transition-colors text-sm"
            >
              Request a Demo
            </Link>
            <a
              href="/elevate-platform-overview.pdf"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white font-extrabold px-10 py-4 rounded-xl transition-colors text-sm"
            >
              <Download className="w-4 h-4" /> Download Overview
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
