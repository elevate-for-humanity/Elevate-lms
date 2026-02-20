import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AuthorityStrip } from '@/components/InstitutionalAuthority';
import { GraduationCap, Clock, Award, DollarSign, CheckCircle2, ArrowRight, Users, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Enrollment | Elevate for Humanity',
  description: 'Enroll in workforce training programs. HVAC, Electrical, Plumbing, Forklift, and more. WIOA and Next Level Jobs eligible.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/enrollment' },
};

export default async function EnrollmentPage() {
  const supabase = await createClient();
  let programs: any[] = [];
  if (supabase) {
    const { data } = await supabase.from('programs').select('id, name, status, description').eq('status', 'active').order('name').limit(20);
    programs = data ?? [];
  }

  const steps = [
    { step: '1', title: 'Apply', desc: 'Complete the student application form with your information and program interest.', href: '/apply/student' },
    { step: '2', title: 'Review', desc: 'Our team reviews your application and contacts you within 1-2 business days.' },
    { step: '3', title: 'Enroll', desc: 'Sign the enrollment agreement, submit required documents, and confirm funding.' },
    { step: '4', title: 'Onboard', desc: 'Complete orientation, access the LMS, and begin your training program.' },
  ];

  const featured = [
    { name: 'HVAC Technician', hours: '400+', weeks: '20', credentials: '6', href: '/apply/student?program=hvac-technician', image: '/images/trades/hero-program-hvac.jpg' },
    { name: 'Electrical Apprenticeship', hours: '400+', weeks: '20', credentials: '4', href: '/apply/student?program=electrical', image: '/images/trades/hero-program-electrical.jpg' },
    { name: 'Plumbing Apprenticeship', hours: '400+', weeks: '20', credentials: '4', href: '/apply/student?program=plumbing', image: '/images/trades/hero-program-plumbing.jpg' },
    { name: 'Forklift Operator', hours: '40', weeks: '1', credentials: '2', href: '/apply/student?program=forklift', image: '/images/programs-hq/skilled-trades-hero.jpg' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Elevate for Humanity enrollment" fill className="object-cover" priority quality={90} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10 max-w-5xl mx-auto">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Enrollment' }]} />
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-4">Enroll in a Training Program</h1>
          <p className="text-gray-300 text-sm md:text-base mt-2 max-w-xl">
            Start your career in the skilled trades. WIOA and Next Level Jobs funding available. No prior experience required.
          </p>
          <div className="mt-4">
            <Link href="/apply/student" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition-colors">
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="py-4 border-b border-gray-100">
        <AuthorityStrip />
      </div>

      {/* How Enrollment Works */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How Enrollment Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-3">{s.step}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-xs text-gray-500">{s.desc}</p>
              {s.href && (
                <Link href={s.href} className="text-xs text-brand-blue-600 font-medium mt-2 inline-block">Start Application</Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Programs */}
      <section className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Available Programs</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Select a program to begin your application</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((p) => (
              <Link key={p.name} href={p.href} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                <div className="relative h-40">
                  <Image src={p.image} alt={p.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.hours} hours</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {p.weeks} weeks</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {p.credentials} credentials</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">WIOA Eligible</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-blue-100 text-brand-blue-700 font-medium">ETPL Listed</span>
                  </div>
                  <div className="mt-3 text-xs text-brand-blue-600 font-semibold group-hover:text-brand-blue-700 flex items-center gap-1">
                    Apply Now <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Funding Options</h2>
        <p className="text-sm text-gray-500 text-center mb-8">Most students pay $0 out of pocket through workforce funding</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'WIOA Funding', desc: 'Workforce Innovation and Opportunity Act covers tuition, materials, and exam fees for eligible participants.', icon: DollarSign },
            { title: 'Next Level Jobs', desc: 'Indiana\'s Workforce Ready Grant covers training costs for high-demand certifications.', icon: FileText },
            { title: 'Employer Sponsorship', desc: 'Partner employers may sponsor training costs with OJT wage reimbursement.', icon: Users },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-xl border border-gray-200 p-5">
              <f.icon className="w-6 h-6 text-brand-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-blue-600 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Ready to Start?</h2>
          <p className="text-brand-blue-100 text-sm mb-6">Applications are reviewed within 1-2 business days. No application fee.</p>
          <Link href="/apply/student" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-blue-700 rounded-lg text-sm font-semibold hover:bg-brand-blue-50 transition-colors">
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
