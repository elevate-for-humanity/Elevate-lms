import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, AlertCircle, Users, TrendingUp, Briefcase, Mail, Award, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transparency & Outcomes | Elevate for Humanity Career & Technical Institute',
  description: 'Program verification, institutional disclosures, and outcome commitments for Elevate for Humanity Career & Technical Institute.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/verification-approvals' },
};

export const revalidate = 3600;

export default function TransparencyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Transparency & Outcomes' }]} />
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4 mt-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Transparency &amp; Outcomes</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Program Verification &amp; Disclosures</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Elevate for Humanity Career &amp; Technical Institute publishes this page so participants, funders, employers, and agency partners can verify our programs and understand exactly what we are.
          </p>
        </div>
      </section>

      {/* Institutional disclosure */}
      <section className="py-12 px-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-4xl mx-auto flex gap-4 items-start">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Institutional Disclosure</h2>
            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p>
                Elevate for Humanity Career &amp; Technical Institute is a <strong>workforce training provider</strong> operating under 2Exclusive LLC-S. We are <strong>not a postsecondary institution</strong> and are not approved by the Indiana Department of Education as a degree-granting or accredited academic institution.
              </p>
              <p>
                We do not grant degrees, diplomas, or academic credits. Industry certifications are issued by the respective certifying organizations upon successful completion of their required examinations — not by Elevate for Humanity.
              </p>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              For full institutional status details, see our <Link href="/accreditation" className="text-brand-red-600 font-semibold hover:underline">Institutional Status page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* What we provide */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">What We Provide</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: <Award className="w-5 h-5 text-brand-red-600" />,
                title: 'Certification Preparation',
                desc: 'Programs prepare participants for industry certifications issued by EPA, CompTIA, PTCB, Microsoft, OSHA, and Indiana IPLA. Passing the exam earns the credential — not enrollment.',
              },
              {
                icon: <TrendingUp className="w-5 h-5 text-brand-red-600" />,
                title: 'Career Readiness Training',
                desc: 'Structured pathways that build job-ready skills aligned with high-demand industries in Indiana.',
              },
              {
                icon: <Briefcase className="w-5 h-5 text-brand-red-600" />,
                title: 'Job Placement Support',
                desc: 'Employer connections and placement assistance for program completers.',
              },
              {
                icon: <Users className="w-5 h-5 text-brand-red-600" />,
                title: 'Reentry Workforce Pathways',
                desc: 'Structured programs for individuals entering or re-entering the workforce, including justice-impacted populations.',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Verification of Participation</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Participants, employers, funders, and agency partners can verify the following through our platform or by contacting us directly:
          </p>
          <div className="space-y-3 mb-6">
            {[
              'Enrollment status in a specific program',
              'Program completion and certificate issuance',
              'DOL apprenticeship registration (Barber Apprenticeship)',
              'ETPL listing status for WIOA-funded programs',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-100">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm">
            Verification requests:{' '}
            <a href="mailto:support@elevateforhumanity.org" className="text-brand-red-600 font-semibold hover:underline">
              support@elevateforhumanity.org
            </a>
          </p>
        </div>
      </section>

      {/* Outcome commitments */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Outcome Commitments</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            We track and report the following outcomes for WIOA-funded and DOL-registered programs in accordance with federal performance accountability requirements:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <FileText className="w-4 h-4" />, label: 'Credential attainment rate', note: 'Participants who earn an industry certification' },
              { icon: <Briefcase className="w-4 h-4" />, label: 'Employment rate', note: 'Completers employed within 2 quarters of exit' },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'Median earnings', note: 'Reported per WIOA Title I requirements' },
              { icon: <CheckCircle className="w-4 h-4" />, label: 'Program completion rate', note: 'Participants who complete all required hours' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-brand-red-600 mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-6">
            Outcome data is reported to Indiana DWD and the U.S. Department of Labor. Contact us to request program performance reports.
          </p>
        </div>
      </section>

      {/* Funding alignment */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Funding Alignment</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Programs are designed to align with the following workforce funding streams. Eligibility and funding determinations are made by the respective agencies — not by Elevate for Humanity.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'WIOA Title I', desc: 'Adult, Dislocated Worker, and Youth formula funds' },
              { name: 'Workforce Ready Grant', desc: 'Indiana state grant for high-demand occupations' },
              { name: 'JRI Funding', desc: 'Justice Reinvestment Initiative reentry workforce funds' },
              { name: 'DOL Apprenticeship', desc: 'Federal apprenticeship funding for registered programs' },
              { name: 'Job Ready Indy', desc: 'City of Indianapolis workforce development funding' },
              { name: 'Self-Pay', desc: 'Payment plans and tuition assistance available' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-100 bg-white">
                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Funders, Employers &amp; Agency Partners</h2>
            <p className="text-slate-400 text-sm">For verification requests, outcome data, or partnership inquiries, contact us directly.</p>
          </div>
          <Link
            href="mailto:support@elevateforhumanity.org"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            <Mail className="w-4 h-4" />Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
