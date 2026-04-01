import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Building2, Award, Users, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Institutional Status | Elevate for Humanity Career & Technical Institute',
  description: 'Elevate for Humanity Career & Technical Institute is a workforce training provider delivering industry-recognized certifications and career pathways. Not a postsecondary institution.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.elevateforhumanity.org/accreditation' },
};

export const revalidate = 3600;

export default function AccreditationPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">Institutional Status</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">
            Elevate for Humanity<br />Career &amp; Technical Institute
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            A workforce training provider focused on industry-recognized certifications, career readiness, and employment pathways for underserved and justice-impacted populations in Indiana.
          </p>
        </div>
      </section>

      {/* Disclosure */}
      <section className="py-12 px-4 bg-amber-50 border-b border-amber-200">
        <div className="max-w-4xl mx-auto flex gap-4 items-start">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">What We Are — and Are Not</h2>
            <div className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                Elevate for Humanity Career &amp; Technical Institute is a <strong>workforce training provider</strong> operating under 2Exclusive LLC-S. We are <strong>not a postsecondary institution</strong> and are not currently approved by the Indiana Department of Education as a degree-granting or accredited academic institution.
              </p>
              <p>
                We do not grant degrees, diplomas, or academic credits. Certifications earned through our programs are issued by the respective industry certifying organizations — not by Elevate for Humanity — upon successful completion of their required examinations.
              </p>
              <p>
                Our programs are workforce training programs designed to lead to employment. They are not substitutes for accredited academic programs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recognized designations */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Recognized Workforce Designations</h2>
          <p className="text-slate-600 mb-8">The actual designations and recognitions Elevate for Humanity holds.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: <Award className="w-5 h-5 text-brand-red-600" />,
                title: 'ETPL-Listed Training Provider',
                desc: "Listed on Indiana's Eligible Training Provider List (ETPL), administered by the Indiana Department of Workforce Development. ETPL listing allows eligible participants to use WIOA Title I funding for our programs.",
              },
              {
                icon: <Building2 className="w-5 h-5 text-brand-red-600" />,
                title: 'DOL Registered Apprenticeship Sponsor',
                desc: 'Registered with the U.S. Department of Labor as an apprenticeship sponsor for the Barber Apprenticeship program. DOL registration is the federal standard for structured on-the-job training.',
              },
              {
                icon: <CheckCircle className="w-5 h-5 text-brand-red-600" />,
                title: 'WIOA Title I Aligned',
                desc: 'Programs are designed to meet WIOA performance accountability requirements including employment, credential attainment, and earnings outcomes.',
              },
              {
                icon: <Users className="w-5 h-5 text-brand-red-600" />,
                title: 'WorkOne Workforce Partner',
                desc: "Recognized partner of Indiana's WorkOne workforce development system, connecting participants to employment services and funding navigation.",
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

      {/* Programs */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Programs We Deliver</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { title: 'HVAC & EPA 608', desc: 'Technician training aligned with EPA Section 608 certification requirements.' },
              { title: 'CNA — Nursing Assistant', desc: 'Clinical readiness training delivered in partnership with accredited nursing program partners.' },
              { title: 'CDL Class A', desc: 'Commercial driver training aligned with FMCSA ELDT requirements, with employer placement support.' },
              { title: 'Barber Apprenticeship', desc: 'DOL-registered 2,000-hour apprenticeship leading to Indiana barber licensure.' },
              { title: 'IT & Digital Skills', desc: 'Entry-level IT training aligned with CompTIA A+ and employer demand.' },
              { title: 'Reentry Workforce Development', desc: 'Career readiness and job placement support for justice-impacted individuals.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-5 rounded-xl border border-slate-100 bg-white">
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

      {/* Credential issuers */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Who Issues Certifications</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Elevate for Humanity does not issue industry certifications. Certifications are issued by the respective certifying organizations upon successful completion of their required examinations. Our role is to prepare participants to pass those exams.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { org: 'EPA', cert: 'Section 608 Technician Certification' },
              { org: 'CompTIA', cert: 'A+, Security+, Network+' },
              { org: 'PTCB', cert: 'Pharmacy Technician (CPhT)' },
              { org: 'Microsoft', cert: 'Office Specialist (MOS)' },
              { org: 'OSHA', cert: 'OSHA 10 / OSHA 30' },
              { org: 'Indiana IPLA', cert: 'Barber License' },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                <p className="font-bold text-slate-900 text-sm">{item.org}</p>
                <p className="text-slate-600 text-xs mt-1">{item.cert}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Partnership &amp; Compliance Inquiries</h2>
            <p className="text-slate-400 text-sm">For funding, partnership, or compliance questions, contact our team directly.</p>
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
