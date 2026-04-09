import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertCircle, FileText, Phone, Mail, ArrowRight, ShieldCheck, ClipboardList } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FSSA / IMPACT Program — Funded Workforce Training | Elevate for Humanity',
  description: 'Elevate for Humanity provides workforce training through the Indiana FSSA IMPACT program. Review eligibility requirements before applying.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/fssa-impact' },
};

export const revalidate = 3600;

export default function FSSAImpactPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">FSSA / IMPACT Program</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Funded Workforce Training</h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            Elevate for Humanity provides workforce training through the Indiana Family and Social Services Administration (FSSA) IMPACT program. This program moves eligible participants into sustainable employment through structured training, attendance requirements, and job placement support.
          </p>
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl max-w-2xl">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-200 text-sm leading-relaxed">
                <strong className="text-amber-100">Enrollment is not automatic.</strong> Enrollment is contingent on eligibility verification, funding approval, and program readiness. All applicants are screened before acceptance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role clarity */}
      <section className="py-10 px-4 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Our Role in This Program</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Elevate for Humanity is the training provider. We pre-screen applicants, verify readiness, coordinate with case managers, and deliver training. We are not the sole authority on funding eligibility — that determination involves your IMPACT case manager and FSSA. We are fully accountable for who enters our training program.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'We Do', items: ['Pre-screen applicants', 'Verify training readiness', 'Coordinate with case managers', 'Deliver training and outcomes'] },
              { label: 'Case Manager Does', items: ['Confirm SNAP / TANF status', 'Issue funding authorization', 'Monitor participation requirements', 'Report outcomes to FSSA'] },
              { label: 'You Must Do', items: ['Meet all eligibility requirements', 'Provide accurate documentation', 'Attend all required training hours', 'Actively pursue employment'] },
            ].map((col, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="font-bold text-slate-900 text-sm mb-2">{col.label}</p>
                <ul className="space-y-1">
                  {col.items.map((item, j) => (
                    <li key={j} className="text-slate-600 text-xs flex gap-2 items-start">
                      <span className="text-brand-red-500 mt-0.5">→</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Eligibility Requirements</h2>
          <p className="text-slate-500 text-sm mb-8">All requirements must be met before an application will be reviewed.</p>
          <div className="space-y-5">

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Administrative Eligibility — Required</h3>
                <p className="text-slate-500 text-sm mt-0.5">Must meet at least one:</p>
              </div>
              <div className="p-6 space-y-2">
                {[
                  { label: 'Currently receiving SNAP (food assistance)', note: 'Active EBT card required' },
                  { label: 'Currently receiving TANF', note: 'Active cash assistance required' },
                  { label: 'Referred by a WorkOne / IMPACT case manager', note: 'Case manager name and office required' },
                  { label: 'Approved for another qualifying funding source', note: 'Must be recognized by the program' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{item.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-slate-100 grid sm:grid-cols-2 gap-2">
                  {['At least 18 years old', 'Indiana resident'].map((item, i) => (
                    <div key={i} className="flex gap-2 items-center p-2 bg-slate-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Education Requirements</h3>
              </div>
              <div className="p-6 space-y-2">
                {['High school diploma', 'GED / HiSET'].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="font-medium text-slate-900 text-sm">{item}</p>
                  </div>
                ))}
                <div className="flex gap-3 items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Actively enrolled in a GED program</p>
                    <p className="text-slate-500 text-xs mt-0.5">Case-by-case approval — requires documentation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Legal Eligibility</h3>
              </div>
              <div className="p-6 space-y-2">
                {[
                  'No active warrants',
                  'No pending criminal charges that would interfere with training, placement, or licensure',
                  'Legally authorized to work in the United States',
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">{item}</p>
                  </div>
                ))}
                <p className="text-slate-500 text-xs pt-2 pl-1">Certain criminal histories may require case-by-case review. Prior convictions do not automatically disqualify an applicant.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Program Readiness — Enforced</h3>
              </div>
              <div className="p-6 space-y-2">
                {[
                  'Attend scheduled training consistently',
                  'Follow safety procedures and use tools responsibly',
                  'Participate in hands-on and classroom instruction',
                  'Stand and work for extended periods (6–8 hours)',
                  'Engage in employment preparation and job placement activities',
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Commitment Requirements</h3>
              </div>
              <div className="p-6 space-y-2">
                {[
                  'Attend all required training hours',
                  'Participate in employment readiness activities',
                  'Complete assigned coursework and checkpoints',
                  'Actively pursue employment upon completion',
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-slate-700 text-sm">{item}</p>
                  </div>
                ))}
                <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">Failure to meet attendance or participation standards may result in removal from the program.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Hard disqualifiers */}
      <section className="py-10 px-4 bg-red-50 border-y border-red-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-start">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">Automatic Disqualifiers</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Under 18 years old', note: 'No exceptions' },
                  { label: 'Not an Indiana resident', note: 'Residency verification required' },
                  { label: 'Not authorized to work in the U.S.', note: 'Work authorization is required' },
                  { label: 'Active warrant', note: 'Must be resolved before application' },
                  { label: 'Cannot attend required training hours', note: 'Schedule must be confirmed before enrollment' },
                  { label: 'Medicaid or HIP only — no SNAP/TANF/referral', note: 'Health coverage alone does not qualify' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 bg-white rounded-lg border border-red-100">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-start mb-6">
            <FileText className="w-6 h-6 text-slate-600 flex-shrink-0 mt-0.5" />
            <h2 className="text-2xl font-bold text-slate-900">Required Documentation</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Proof of SNAP or TANF benefits',
              'Valid government-issued ID',
              'Social Security verification',
              'Proof of Indiana residency',
              'Education verification (diploma, GED, or transcripts)',
              'Background disclosure (if applicable)',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-center p-3 bg-white rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <p className="text-slate-700 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How Enrollment Works</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Submit Application', desc: 'Complete the eligibility screening and application form. All fields are required.' },
              { step: '2', title: 'Eligibility & Readiness Review', desc: 'Our team reviews your application. You will be classified as Eligible, Conditional Review, or Not Eligible based on fixed criteria.' },
              { step: '3', title: 'Documentation Verification', desc: 'You may be contacted to provide proof of benefits, ID, residency, or education. Missing documents delay processing.' },
              { step: '4', title: 'Case Manager Coordination', desc: 'If you have a WorkOne or IMPACT case manager, we coordinate with them to confirm funding authorization before enrollment.' },
              { step: '5', title: 'Enrollment Decision', desc: 'Final decision: Enroll, Hold (pending documentation or case manager confirmation), or Do Not Enroll. You will be notified directly.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start p-5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="w-9 h-9 rounded-full bg-brand-red-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">{item.step}</div>
                <div>
                  <p className="font-semibold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Services */}
      <section className="py-14 px-4 bg-blue-50 border-b border-blue-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Support Services &amp; Barrier Removal</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Eligible participants may qualify for supportive services through approved workforce funding or partner agencies. Depending on program rules and available funding, support may include:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Transportation assistance', note: 'Coordination and referral support for eligible participants' },
              { label: 'Work supplies', note: 'Tools, uniforms, or materials required for training or employment' },
              { label: 'Childcare support', note: 'Referral to approved childcare assistance programs' },
              { label: 'Referral coordination', note: 'Connection to partner agencies for additional barrier-removal services' },
              { label: 'Other barrier-removal services', note: 'Services that help participants stay engaged in training and employment' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-white rounded-lg border border-blue-100">
                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">{item.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-white border border-blue-200 rounded-xl">
            <p className="text-slate-600 text-sm leading-relaxed">
              <strong className="text-slate-900">Important:</strong> Supportive services are not guaranteed. Availability depends on program rules, funding authorization, and the applicable agency. Eligibility for support services is determined by your case manager and the funding agency — not by Elevate. If you have a transportation barrier or other need that may affect attendance, disclose it on your application so we can coordinate appropriately.
            </p>
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="py-8 px-4 bg-amber-50 border-b border-amber-100">
        <div className="max-w-4xl mx-auto flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900 text-sm mb-1">Important Notice</p>
            <ul className="text-slate-700 text-sm space-y-1">
              <li>All applications are subject to verification.</li>
              <li>Submission does not guarantee enrollment.</li>
              <li>Final acceptance is based on eligibility, funding approval, readiness, and program capacity.</li>
              <li>Incomplete, inaccurate, or unverifiable information may result in denial or delayed processing.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <ClipboardList className="w-10 h-10 text-brand-red-400 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-4">Apply for Eligibility &amp; Enrollment Review</h2>
          <p className="text-slate-300 text-lg mb-3 max-w-xl mx-auto">
            If you meet the requirements above, proceed to the application. Do not apply if you do not meet the eligibility requirements.
          </p>
          <p className="text-slate-400 text-sm mb-8 max-w-xl mx-auto">
            A team member or case partner may contact you to verify eligibility before enrollment is approved.
          </p>
          <Link
            href="/apply/student?funding=fssa-impact"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold text-lg px-10 py-4 rounded-full transition-colors shadow-lg"
          >
            Start Application
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Questions Before You Apply?</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            Not sure if you qualify? Contact us before submitting. Do not submit an application if you are unsure.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <a href="tel:3173143757" className="flex gap-3 items-center p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
              <Phone className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Call or Text</p>
                <p className="text-slate-600 text-sm">(317) 314-3757</p>
              </div>
            </a>
            <a href="mailto:info@elevateforhumanity.org" className="flex gap-3 items-center p-5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
              <Mail className="w-5 h-5 text-brand-red-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Email Us</p>
                <p className="text-slate-600 text-sm">info@elevateforhumanity.org</p>
              </div>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
