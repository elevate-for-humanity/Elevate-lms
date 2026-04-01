import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, Users, TrendingUp, Briefcase, Mail, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Transparency & Outcomes | Elevate for Humanity Career & Technical Institute',
  description: 'Elevate for Humanity Career & Technical Institute is committed to transparency in how we deliver training and track outcomes.',
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
          <h1 className="text-4xl font-extrabold text-white mb-4">Program Verification</h1>
          <p className="text-slate-300 text-lg max-w-2xl">Elevate for Humanity Career &amp; Technical Institute is committed to transparency in how we deliver training and track outcomes.</p>
        </div>
      </section>

      {/* What We Provide */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">What We Provide</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: <Award className="w-5 h-5 text-brand-red-600" />, title: 'Industry-Recognized Certifications', desc: 'Programs are designed to prepare participants for nationally recognized certifications issued by the respective certifying organizations.' },
              { icon: <TrendingUp className="w-5 h-5 text-brand-red-600" />, title: 'Career Readiness Training', desc: 'Structured pathways that build job-ready skills aligned with high-demand industries.' },
              { icon: <Briefcase className="w-5 h-5 text-brand-red-600" />, title: 'Job Placement Support', desc: 'Employer connections and placement assistance for program completers.' },
              { icon: <Users className="w-5 h-5 text-brand-red-600" />, title: 'Reentry Workforce Pathways', desc: 'Structured programs for individuals entering or re-entering the workforce, including justice-impacted populations.' },
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

      {/* Verification of Participation */}
      <section className="py-14 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Verification of Participation</h2>
          <p className="text-slate-600 leading-relaxed mb-6">Participants and partners can verify the following through our platform or by contacting us directly:</p>
          <div className="space-y-3">
            {[
              'Enrollment status in a specific program',
              'Program completion and credential issuance',
              'Certificates issued through our LMS platform',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-100">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-6">To submit a verification request, contact: <a href="mailto:support@elevateforhumanity.org" className="text-brand-red-600 font-semibold hover:underline">support@elevateforhumanity.org</a></p>
        </div>
      </section>

      {/* Partnership Alignment */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Partnership Alignment</h2>
          <p className="text-slate-600 leading-relaxed mb-4">We work alongside employers, nonprofits, and workforce agencies to ensure training translates into employment opportunities. Program design is informed by real labor market demand and partner feedback.</p>
          <p className="text-slate-600 leading-relaxed">Our programs are designed to align with WIOA, Indiana Workforce Ready Grant, and DOL apprenticeship standards where applicable.</p>
        </div>
      </section>

      {/* Ongoing Development */}
      <section className="py-14 px-4 bg-amber-50 border-y border-amber-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ongoing Development</h2>
          <p className="text-slate-700 leading-relaxed">We are actively expanding our partnerships and pursuing additional approvals and recognitions where appropriate. Elevate for Humanity Career &amp; Technical Institute is <strong>not currently approved as a postsecondary institution</strong> through the Indiana Department of Education. Our focus remains on delivering measurable outcomes and scalable workforce solutions.</p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Funders, Employers &amp; Agency Partners</h2>
            <p className="text-slate-400 text-sm">If you are seeking verification or partnership information, contact us directly.</p>
          </div>
          <Link href="mailto:support@elevateforhumanity.org" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
            <Mail className="w-4 h-4" />Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
