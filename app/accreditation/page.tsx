import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, CheckCircle, Building2, Users, TrendingUp, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Institutional Status | Elevate for Humanity Career & Technical Institute',
  description: 'Elevate for Humanity Career & Technical Institute is a workforce training provider delivering industry-recognized certifications and career pathways.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/accreditation' },
};

export const revalidate = 3600;

export default function AccreditationPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Institutional Status</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">Elevate for Humanity<br />Career &amp; Technical Institute</h1>
          <p className="text-slate-300 text-lg max-w-2xl">A workforce training provider focused on delivering industry-recognized certifications, career readiness training, and employment pathways for underserved and justice-impacted populations.</p>
        </div>
      </section>

      <section className="py-14 px-4 bg-amber-50 border-b border-amber-100">
        <div className="max-w-4xl mx-auto flex gap-4 items-start">
          <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Postsecondary Approval Status</h2>
            <p className="text-slate-700 leading-relaxed">Elevate for Humanity Career &amp; Technical Institute is <strong>not currently approved as a postsecondary institution</strong> through the Indiana Department of Education. We are actively building program quality, employer partnerships, and measurable outcomes as part of our long-term approval and expansion strategy.</p>
            <p className="text-slate-600 mt-3 leading-relaxed">Our programs are workforce training programs — not degree-granting or federally accredited academic programs. Certifications are issued by the respective industry certifying organizations upon successful completion of required examinations.</p>
          </div>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">What We Deliver</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Skilled Trades & Safety', desc: 'HVAC, EPA 608, and OSHA-aligned safety training for high-demand trades.' },
              { title: 'Healthcare Pathways', desc: 'CNA certification preparation and clinical readiness training.' },
              { title: 'Transportation', desc: 'CDL Class A training with employer placement support.' },
              { title: 'Apprenticeship Programs', desc: 'DOL-registered Barber Apprenticeship with structured on-the-job training.' },
              { title: 'Reentry Workforce Development', desc: 'Career readiness and job placement support for justice-impacted individuals.' },
              { title: 'Digital & Technical Pathways', desc: 'Entry-level IT and digital skills training aligned with employer demand.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-5 rounded-xl border border-slate-100 bg-slate-50">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 mb-1">{item.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Commitment to Quality</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Transparent reporting of enrollment and completion outcomes',
              'Industry-aligned curriculum informed by employer demand',
              'Employer-driven program design and placement support',
              'Continuous improvement and compliance readiness',
            ].map((text, i) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-lg bg-white border border-slate-100">
                <CheckCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Workforce Alignment</h2>
          <p className="text-slate-600 leading-relaxed mb-4">We operate in partnership with employers, community organizations, and workforce agencies to ensure training leads to real employment outcomes. Our programs are designed to align with WIOA, Indiana Workforce Ready Grant, and DOL apprenticeship standards where applicable.</p>
          <p className="text-slate-600 leading-relaxed">We are actively pursuing additional state approvals and recognitions as we expand our program offerings and outcomes data.</p>
        </div>
      </section>

      {/* Founder Credentials & Authorizations */}
      <section className="py-14 px-4 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Founder Credentials &amp; Authorizations</h2>
          <p className="text-slate-600 text-sm mb-8">
            Elizabeth Greene, Founder &amp; CEO — credentials held personally and applied through Elevate for Humanity and SupersonicFastCash.
          </p>

          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">IRS &amp; Tax Authorizations</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'IRS Enrolled Agent (EA)', detail: 'Authorized to represent taxpayers before the IRS in audits, collections, and appeals.' },
                { label: 'EFIN — Electronic Filing Identification Number', detail: 'IRS-issued number authorizing the preparation and e-filing of federal tax returns.' },
                { label: 'PTIN — Preparer Tax Identification Number', detail: 'IRS-required identification for all paid tax return preparers.' },
                { label: 'ERO — Electronic Return Originator', detail: 'Authorized IRS e-file originator for individual and business returns.' },
                { label: 'SBIN — IRS Submitter ID', detail: 'Authorized to submit returns directly to the IRS for both for-profit and non-profit filers.' },
                { label: 'VITA Site', detail: 'IRS-authorized Volunteer Income Tax Assistance site — free tax preparation for qualifying individuals.' },
              ].map((cred) => (
                <div key={cred.label} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-1">{cred.label}</p>
                    <p className="text-slate-600 text-xs leading-relaxed">{cred.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Testing &amp; Curriculum Authorizations</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'EPA 608 Certified Proctor', detail: 'Authorized to proctor EPA Section 608 refrigerant handling certification exams.' },
                { label: 'ACT WorkKeys — Authorized Testing Site (Realm: 1317721865)', detail: 'Authorized ACT WorkKeys testing site. Administers Applied Math, Workplace Documents, and Business Writing assessments for the National Career Readiness Certificate (NCRC).' },
                { label: 'Milady RISE — Proctor & Curriculum Partner', detail: 'Authorized proctor and curriculum delivery partner for Milady RISE cosmetology and barbering coursework.' },
                { label: 'Black Certified — Partner', detail: 'Certified partner for Black Certified credentialing and professional development programs.' },
              ].map((cred) => (
                <div key={cred.label} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-1">{cred.label}</p>
                    <p className="text-slate-600 text-xs leading-relaxed">{cred.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Workforce Funding &amp; Program Partners</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[

                { label: 'Job Ready Indy — Approved Provider', detail: 'Approved Job Ready Indy training provider for justice-involved individuals in Marion County.' },
                { label: 'Workforce Ready Grant (WRG)', detail: 'Approved provider under Indiana\'s Workforce Ready Grant for high-demand certification programs.' },
                { label: 'WIOA — Workforce Innovation and Opportunity Act', detail: 'Eligible Training Provider on the Indiana ETPL. Programs available at no cost to qualifying participants.' },
                { label: 'U.S. Department of Labor — Registered Apprenticeship', detail: 'DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301). Barber Apprenticeship program registered and active.' },
                { label: 'Indiana State Board (IPLA)', detail: 'Programs aligned with Indiana Professional Licensing Agency standards for barber and cosmetology licensure.' },
                { label: 'ITAP — Indiana Training Approval Process', detail: 'Programs approved through Indiana\'s Training Approval Process for ETPL eligibility and workforce funding.' },
              ].map((cred) => (
                <div key={cred.label} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <CheckCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm mb-1">{cred.label}</p>
                    <p className="text-slate-600 text-xs leading-relaxed">{cred.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Military Service</p>
            <div className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 max-w-md">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm mb-1">U.S. Army Veteran</p>
                <p className="text-slate-600 text-xs leading-relaxed">Unit Supply Specialist — honorably served.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Partnership &amp; Compliance Inquiries</h2>
            <p className="text-slate-400 text-sm">For funding, partnership, or compliance questions, contact our team directly.</p>
          </div>
          <Link href="mailto:support@elevateforhumanity.org" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
            <Mail className="w-4 h-4" />Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
