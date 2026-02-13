import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Direct Support Professional (DSP) Training | Elevate',
  description: 'DSP training in Indianapolis. Learn to support individuals with disabilities. Certification included. Funding available.',
  alternates: { canonical: `${SITE_URL}/programs/direct-support-professional` },
  openGraph: {
    title: 'Direct Support Professional Training | Indianapolis',
    description: 'DSP certification training — support individuals with disabilities.',
    url: `${SITE_URL}/programs/direct-support-professional`,
    images: [{ url: `${SITE_URL}/images/healthcare/hero-program-patient-care.jpg`, width: 1200, height: 630 }],
  },
};

export default function DSPPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Healthcare', href: '/programs/healthcare' }, { label: 'Direct Support Professional' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/healthcare/hero-program-patient-care.jpg" alt="Direct Support Professional Training" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Funding Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Direct Support Professional</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Support individuals with intellectual and developmental disabilities. Make a difference every day.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '2-4 Weeks', label: 'Program Length' },
            { val: 'DSP Cert', label: 'Certification' },
            { val: '$28K-$38K', label: 'Salary Range' },
            { val: 'Growing', label: 'Job Market' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/healthcare/hero-programs-healthcare.jpg" alt="DSP training" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Training to provide daily living support and advocacy for individuals with disabilities.</p>
              <div className="space-y-2">
                {['Person-centered care planning', 'Daily living skills assistance', 'Behavioral support strategies', 'Medication administration basics', 'Crisis intervention and de-escalation', 'Documentation and reporting', 'Rights and advocacy for individuals served'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Where DSPs Work</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { title: 'Group Homes', salary: '$28K-$35K' },
              { title: 'Day Programs', salary: '$28K-$34K' },
              { title: 'In-Home Support', salary: '$30K-$38K' },
              { title: 'Community Centers', salary: '$29K-$36K' },
              { title: 'Residential Facilities', salary: '$30K-$37K' },
              { title: 'Schools', salary: '$28K-$35K' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-blue-600 font-bold text-sm">{c.salary}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your student application.' },
              { step: '2', title: 'Background Check', desc: 'Required for working with vulnerable populations.' },
              { step: '3', title: 'Complete Training', desc: 'Classroom and hands-on instruction.' },
              { step: '4', title: 'Get Certified & Hired', desc: 'Earn your DSP certification and start working.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Make a Difference Every Day</h2>
          <p className="text-white/90 mb-6 text-sm">Support individuals with disabilities. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=direct-support-professional" className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-blue-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/funding" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
