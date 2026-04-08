import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, AlertCircle, ArrowRight, Phone, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SNAP E&T Partner | IMPACT Program | Elevate for Humanity',
  description:
    'Elevate for Humanity is an ETPL-approved, DOL-registered training provider participating in Indiana\'s SNAP E&T program (IMPACT) through FSSA/DFR. Information for agency staff and case managers.',
  keywords: [
    'SNAP E&T Indiana',
    'IMPACT program training provider',
    'FSSA DFR approved provider',
    'Indiana workforce training SNAP',
    'ETPL approved Indiana',
    'WorkOne training partner',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/snap-et-partner',
  },
};

export const revalidate = 3600;

export default function SNAPETPartnerPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'SNAP E&T / IMPACT' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            For Agency Staff &amp; Case Managers
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            SNAP E&T / IMPACT Program Partner
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            Elevate for Humanity Career &amp; Technical Institute is an approved training provider
            participating in Indiana's SNAP Employment and Training program (IMPACT), administered
            by FSSA through the Division of Family Resources (DFR).
          </p>
        </div>
      </section>

      {/* Provider credentials */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Provider Credentials</h2>
          <div className="space-y-3">
            {[
              { label: 'ETPL Approved', detail: 'Indiana Eligible Training Provider List — programs approved by Indiana DWD (INTraining Location ID: 10004621)' },
              { label: 'DOL Registered Apprenticeship Sponsor', detail: 'U.S. Department of Labor registered sponsor for Barber, HVAC, and Building Maintenance apprenticeships' },
              { label: 'WRG Approved Programs', detail: 'Workforce Ready Grant eligible programs on file with Indiana DWD' },
              { label: 'Job Ready Indy Partner', detail: 'Approved provider for justice-involved individuals through the Job Ready Indy initiative' },
              { label: 'SNAP E&T Participant', detail: 'Participating in Indiana\'s IMPACT program through FSSA/DFR for SNAP E&T referrals' },
            ].map(({ label, detail }) => (
              <div key={label} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-5">
                <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs eligible for SNAP E&T referral */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Programs Eligible for SNAP E&T Referral</h2>
          <p className="text-slate-600 text-sm mb-6">
            All programs listed are short-term (16 weeks or less), credential-bearing, and aligned
            with Indiana's IMPACT program requirements.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'HVAC / EPA 608 Certification', weeks: '8 weeks' },
              { name: 'Certified Nursing Assistant (CNA)', weeks: '6 weeks' },
              { name: 'Barber / Cosmetology', weeks: '16 weeks' },
              { name: 'CDL (Commercial Driver\'s License)', weeks: '8 weeks' },
              { name: 'Community Health Worker (CHW)', weeks: '10 weeks' },
              { name: 'Peer Recovery Coach', weeks: '8 weeks' },
              { name: 'Home Health Aide', weeks: '6 weeks' },
              { name: 'Tax Preparation', weeks: '10 weeks' },
            ].map(({ name, weeks }) => (
              <div key={name} className="flex items-center justify-between bg-white rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-900">{name}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{weeks}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational readiness */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Operational Readiness</h2>
          <p className="text-slate-600 text-sm mb-6">
            What Elevate has in place to meet DFR compliance requirements from day one.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Weekly attendance tracking', detail: 'Built into the Elevate LMS — hour-level tracking per participant per week' },
              { title: 'Case management', detail: 'Embedded in enrollment and ongoing participant support — documented per regulatory requirement' },
              { title: 'Outcome reporting', detail: 'Credential attainment, employment placement, and wage data tracked per cohort' },
              { title: 'Employer relationships', detail: 'Active hiring partnerships across HVAC, CNA, Barber, CDL, and other program areas' },
              { title: 'SNAP recipient identification', detail: 'Intake forms collect benefit status — SNAP recipients identified at enrollment' },
              { title: 'Post-completion support', detail: 'Job placement follow-up and alumni support after credential attainment' },
              { title: 'Financially independent', detail: 'Programs operate without dependence on E&T reimbursement — costs are incurred and documented before any claim' },
              { title: 'Non-federal funding sources', detail: 'Tuition, employer partnerships, and grants provide the non-federal match required for 50/50 reimbursement' },
            ].map(({ title, detail }) => (
              <div key={title} className="bg-white rounded-xl border border-slate-200 p-5">
                <p className="font-semibold text-slate-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral process */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Referral Process</h2>
          <p className="text-slate-600 text-sm mb-8">
            Elevate accepts both direct referrals from IMPACT and reverse referrals from
            SNAP recipients who self-identify.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-3">Direct Referral</p>
              <p className="text-sm text-slate-600 mb-4">IMPACT refers a participant to Elevate after orientation.</p>
              <ol className="space-y-3">
                {[
                  'IMPACT sends referral via secure email with participant name and contact info',
                  'Elevate is notified if participant is an ABAWD',
                  'Elevate contacts participant to confirm interest and explain next steps',
                  'Elevate notifies DFR of enrollment with training dates, program name, and signed Authorization for Release of Information',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-green-600 mb-3">Reverse Referral</p>
              <p className="text-sm text-slate-600 mb-4">A SNAP recipient approaches Elevate directly.</p>
              <ol className="space-y-3">
                {[
                  'Elevate sends secure email to IMPACT 50 mailbox with participant name, expected training dates, program, and signed Authorization for Release of Information',
                  'DFR verifies eligibility and coordinates orientation scheduling with IMPACT',
                  'IMPACT sends Elevate the orientation date',
                  'Once orientation is complete, Elevate takes over case management',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 bg-brand-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-800 leading-relaxed">
              <strong>Orientation first.</strong> The SNAP participant must complete an E&T orientation
              with IMPACT before entering the Elevate program. No costs can be incurred or billed
              prior to orientation completion.
            </p>
          </div>
        </div>
      </section>

      {/* Contact / questions */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Questions &amp; Contact</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex gap-3 items-start">
              <FileText className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm mb-1">IMPACT 50/50 Inbox</p>
                <p className="text-sm text-slate-600 mb-1">For E&T and TPP questions directed to DFR:</p>
                <a href="mailto:IMPACT50@fssa.IN.gov" className="text-brand-blue-600 font-semibold text-sm hover:underline">
                  IMPACT50@fssa.IN.gov
                </a>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex gap-3 items-start">
              <Phone className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm mb-1">Elevate for Humanity</p>
                <p className="text-sm text-slate-600 mb-1">For partnership inquiries and referral coordination:</p>
                <a href="tel:3173143757" className="text-brand-blue-600 font-semibold text-sm hover:underline">
                  (317) 314-3757
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Work Together?</h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Complete the DFR questionnaire for potential SNAP Third Party Partners — we'll send you
            a formatted copy and notify our team to follow up with DFR.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/snap-et-partner/questionnaire"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-full transition shadow-lg"
            >
              Complete TPP Questionnaire <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/fssa-partnership-request"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-10 py-4 rounded-full transition border border-white/30"
            >
              Agency Partnership Request
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
