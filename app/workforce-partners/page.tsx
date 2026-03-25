import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, ArrowRight, CheckCircle, Calendar } from 'lucide-react';
import PartnerMeetingForm from './PartnerMeetingForm';

export const metadata: Metadata = {
  title: 'Workforce & Agency Partners | Elevate for Humanity',
  description: 'Elevate for Humanity helps workforce boards, state agencies, and community partners deliver credentialed training, testing, and employment pathways — with built-in WIOA and RAPIDS compliance.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/workforce-partners' },
  openGraph: {
    title: 'Workforce & Agency Partners | Elevate for Humanity',
    description: 'End-to-end workforce training delivery with WIOA compliance, RAPIDS reporting, and credential attainment. Partner with us.',
    type: 'website',
  },
};

export default function WorkforcePartnersPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-slate-950 min-h-[560px] flex items-center">
        <video
          src="/videos/training-providers-hero.mp4"
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-4">For Workforce Boards, Agencies & Community Partners</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6 max-w-3xl">
            Expand Training Capacity.<br />Deliver Compliant Outcomes.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-2xl">
            Elevate for Humanity helps agencies connect residents to industry-recognized credentials and supports compliant delivery for workforce-funded programs — WIOA, RAPIDS, WRG, and JRI.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#partner-form" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors text-base">
              Request a Partnership Meeting
            </a>
            <a href="#refer" className="border-2 border-white/30 text-white font-bold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-base">
              Refer a Program or Cohort
            </a>
          </div>
          <p className="mt-6 text-slate-400 text-sm">
            Call or text: <a href="tel:3173143757" className="text-white font-semibold hover:text-brand-red-300">(317) 314-3757</a>
          </p>
        </div>
      </section>

      {/* ── POSITIONING STATEMENT ── */}
      <section className="bg-brand-red-700 py-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white text-lg sm:text-xl font-semibold leading-relaxed">
            &ldquo;Elevate for Humanity helps workforce and community partners deliver credentialed training, testing, and employment pathways — with the compliance infrastructure to back it up.&rdquo;
          </p>
        </div>
      </section>

      {/* ── WHAT WE DELIVER ── */}
      <section className="bg-white py-16 sm:py-20 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">What we deliver</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 text-center">End-to-End Workforce Training Infrastructure</h2>
          <p className="text-slate-500 text-sm text-center mb-12 max-w-xl mx-auto">
            We don&apos;t just teach courses. We operate the full pipeline — from enrollment to credential attainment to employer placement.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: '🎓',
                title: 'Training Delivery',
                desc: 'ETPL-approved programs in healthcare, trades, IT, and more. In-person, hybrid, and cohort-based delivery.',
                color: 'border-brand-blue-500',
              },
              {
                icon: '📋',
                title: 'Compliance & Reporting',
                desc: 'WIOA-aligned participant tracking, RAPIDS-compliant apprenticeship reporting, and outcome documentation.',
                color: 'border-brand-red-500',
              },
              {
                icon: '💻',
                title: 'Credentialing & Testing',
                desc: 'Certiport Authorized Testing Center. EPA 608, NHA, WorkKeys, and Microsoft certifications on-site.',
                color: 'border-violet-500',
              },
              {
                icon: '🤝',
                title: 'Employer Connections',
                desc: 'Pre-screened, job-ready graduates. OJT reimbursement structuring and WOTC support for hiring partners.',
                color: 'border-emerald-500',
              },
            ].map((s) => (
              <div key={s.title} className={`border-t-4 ${s.color} bg-slate-50 rounded-xl p-6`}>
                <span className="text-3xl block mb-3">{s.icon}</span>
                <h3 className="font-extrabold text-slate-900 text-base mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE CREDENTIALS ── */}
      <section className="bg-slate-950 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3 text-center">Compliance infrastructure</p>
          <h2 className="text-2xl font-extrabold text-white mb-10 text-center">Built for Audit. Ready for Contracts.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'DOL RAPIDS-Compliant', desc: 'Registered apprenticeship programs with RTI hours tied to occupations and DOL reporting.' },
              { label: 'Indiana ETPL Certified', desc: 'On the Indiana DWD Eligible Training Provider List — eligible for WIOA Individual Training Accounts.' },
              { label: 'WIOA Title I Aligned', desc: 'Programs structured for Adult, Dislocated Worker, and Youth funding streams.' },
              { label: 'Workforce Ready Grant', desc: 'Indiana state grant-eligible programs for high-demand certifications.' },
              { label: 'JRI / Justice Reinvestment', desc: 'Approved to serve justice-involved individuals through Indiana DWD funding.' },
              { label: 'EmployIndy Partner', desc: 'Integrated with Indianapolis workforce ecosystem for referrals and co-enrollment.' },
            ].map((c) => (
              <div key={c.label} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-sm mb-1">{c.label}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW WE PARTNER ── */}
      <section className="bg-white py-16 sm:py-20 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Partnership models</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-12 text-center">How We Work With Agencies</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Training Delivery Partner',
                desc: 'Your agency refers participants. We deliver the training, manage compliance, and report outcomes back to you. Ideal for WorkOne centers and workforce boards.',
                cta: 'Refer a Cohort',
                href: '#refer',
              },
              {
                num: '02',
                title: 'Co-Enrollment Partner',
                desc: 'We co-enroll participants in WIOA-funded programs, handle ITA documentation, and coordinate with your case managers throughout training.',
                cta: 'Request a Meeting',
                href: '#partner-form',
              },
              {
                num: '03',
                title: 'Managed Program Operator',
                desc: 'We operate a full workforce training program on your behalf — curriculum, instruction, compliance, testing, and placement reporting.',
                cta: 'Discuss a Contract',
                href: '#partner-form',
              },
            ].map((m) => (
              <div key={m.num} className="bg-slate-50 border border-slate-200 rounded-xl p-7 flex flex-col">
                <p className="text-4xl font-black text-slate-200 mb-4">{m.num}</p>
                <h3 className="font-extrabold text-slate-900 text-base mb-3">{m.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-6">{m.desc}</p>
                <a href={m.href} className="inline-flex items-center gap-1.5 text-brand-red-600 hover:text-brand-red-700 font-bold text-sm">
                  {m.cta} <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REFER SECTION ── */}
      <section id="refer" className="bg-slate-50 border-t border-slate-200 py-14 px-6">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3">Referrals</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Refer a Program or Cohort</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Have a group of participants ready for training? A specific occupation or funding stream in mind? Send us the details and we&apos;ll structure a program around your cohort — including compliance documentation, scheduling, and outcome reporting.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <a href="#partner-form" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm text-center">
              Submit a Referral
            </a>
            <a href="tel:3173143757" className="flex items-center justify-center gap-2 border border-slate-300 text-slate-700 font-semibold px-8 py-3.5 rounded-lg hover:bg-white transition-colors text-sm">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>

      {/* ── MEETING REQUEST FORM ── */}
      <section id="partner-form" className="bg-white border-t border-slate-200 py-16 sm:py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-3 text-center">Get started</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 text-center">Request a Partnership Meeting</h2>
          <p className="text-slate-500 text-sm text-center mb-10">
            Tell us about your agency and what you&apos;re trying to accomplish. We respond within 24 hours.
          </p>
          <PartnerMeetingForm />
        </div>
      </section>

    </main>
  );
}
