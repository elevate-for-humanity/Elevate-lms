import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Nail Technician Apprenticeship | Elevate',
  description: 'Nail technician apprenticeship in Indianapolis. Learn manicure, pedicure, acrylics, and gel nails. Get your Indiana nail tech license.',
  alternates: { canonical: `${SITE_URL}/programs/nail-technician-apprenticeship` },
  openGraph: {
    title: 'Nail Technician Apprenticeship | Indianapolis',
    description: 'Nail tech training — manicure, pedicure, acrylics, gel nails.',
    url: `${SITE_URL}/programs/nail-technician-apprenticeship`,
    images: [{ url: `${SITE_URL}/images/pathways/beauty-hero.jpg`, width: 1200, height: 630 }],
  },
};

export default function NailTechnicianPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Beauty', href: '/programs/beauty' }, { label: 'Nail Technician' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/pathways/beauty-hero.jpg" alt="Nail Technician Training" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Apprenticeship</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Nail Technician</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Learn manicure, pedicure, acrylics, and gel nails. Get your Indiana nail technician license.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '6-9 Months', label: 'Program Length' },
            { val: 'State License', label: 'Nail Tech' },
            { val: '$25K-$40K', label: 'Salary Range' },
            { val: 'Flexible', label: 'Schedule' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on training in nail care techniques and salon operations.</p>
          <div className="space-y-2">
            {['Manicure and pedicure techniques', 'Acrylic and gel nail application', 'Nail art and design', 'Sanitation and infection control', 'Client consultation and service planning', 'Indiana State Board exam preparation'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Career Paths</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Salon Nail Tech', salary: '$25K-$35K' },
              { title: 'Booth Rental', salary: '$30K-$45K+' },
              { title: 'Salon Owner', salary: '$40K-$80K+' },
              { title: 'Nail Art Specialist', salary: '$30K-$50K' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-red-600 font-bold text-sm">{c.salary}</div>
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
              { step: '1', title: 'Apply Online', desc: 'Submit your apprenticeship application.' },
              { step: '2', title: 'Start Training', desc: 'Hands-on instruction in a salon environment.' },
              { step: '3', title: 'Complete Hours', desc: 'Finish your required training hours.' },
              { step: '4', title: 'Get Licensed', desc: 'Pass the Indiana State Board nail tech exam.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Nail Tech Career</h2>
          <p className="text-white/90 mb-6 text-sm">Creative career with flexible schedule. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=nail-technician" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-red-50 transition-colors text-center">
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
