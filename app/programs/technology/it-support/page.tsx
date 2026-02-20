export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'IT Support Training | CompTIA A+ | Elevate',
  description: 'IT support training in Indianapolis. CompTIA A+ certification prep. Learn hardware, software, networking, and help desk skills.',
  alternates: { canonical: `${SITE_URL}/programs/technology/it-support` },
  openGraph: {
    title: 'IT Support Training | Indianapolis',
    description: 'CompTIA A+ certification prep with hands-on labs.',
    url: `${SITE_URL}/programs/technology/it-support`,
    images: [{ url: `${SITE_URL}/images/programs-hq/it-support.jpg`, width: 1200, height: 630 }],
  },
};

export default async function ITSupportPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('programs').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Technology', href: '/programs/technology' }, { label: 'IT Support' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs-hq/it-support.jpg" alt="IT Support Training" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Funding Available</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">IT Support</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Learn hardware, software, networking, and help desk skills. CompTIA A+ certification prep included.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '8-12 Weeks', label: 'Program Length' },
            { val: 'CompTIA A+', label: 'Certification' },
            { val: '$35K-$60K', label: 'Salary Range' },
            { val: 'Remote OK', label: 'Work Options' },
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
              <Image src="/images/programs-hq/it-support.jpg" alt="IT support training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on labs covering hardware, software, and networking fundamentals.</p>
              <div className="space-y-2">
                {['PC hardware assembly and troubleshooting', 'Windows, macOS, and Linux operating systems', 'Network configuration and Wi-Fi setup', 'Help desk ticketing and customer service', 'Malware removal and security basics', 'Printer and peripheral support', 'CompTIA A+ exam preparation'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-blue-600 rounded-full flex-shrink-0" />
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Paths</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Help Desk Tech', salary: '$35K-$45K' },
              { title: 'Desktop Support', salary: '$40K-$55K' },
              { title: 'IT Support Specialist', salary: '$42K-$60K' },
              { title: 'Field Technician', salary: '$38K-$52K' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-blue-600 font-bold text-sm">{c.salary}</div>
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
              { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for WIOA/JRI eligibility.' },
              { step: '3', title: 'Complete Training', desc: 'Hands-on labs and coursework.' },
              { step: '4', title: 'Get Certified & Hired', desc: 'Pass CompTIA A+ and connect with employers.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your IT Career</h2>
          <p className="text-white mb-6 text-sm">Entry point into tech. Remote-friendly. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=it-support" className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center">
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
