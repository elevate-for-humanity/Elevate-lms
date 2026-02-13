import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CPR & First Aid Certification | HSI Certified | Elevate',
  description: 'CPR, AED, and First Aid certification in Indianapolis. HSI certified. Same-day certification available. Group and individual classes.',
  alternates: { canonical: `${SITE_URL}/programs/cpr-first-aid-hsi` },
  openGraph: {
    title: 'CPR & First Aid Certification | HSI Certified',
    description: 'Same-day CPR, AED, and First Aid certification. HSI certified.',
    url: `${SITE_URL}/programs/cpr-first-aid-hsi`,
    images: [{ url: `${SITE_URL}/images/programs/efh-cpr-aed-first-aid-hero.jpg`, width: 1280, height: 854 }],
  },
};

export default function CPRFirstAidPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'CPR & First Aid' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs/efh-cpr-aed-first-aid-hero.jpg" alt="CPR & First Aid Certification" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Same-Day Certification</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">CPR &amp; First Aid</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              HSI certified CPR, AED, and First Aid training. Get certified in one day. Individual and group classes available.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '1 Day', label: 'Class Length' },
            { val: 'HSI', label: 'Certified' },
            { val: '2 Years', label: 'Cert Valid' },
            { val: 'Group OK', label: 'Team Training' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Courses Offered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'CPR & AED', desc: 'Adult, child, and infant CPR with AED training', img: '/images/healthcare/cpr-individual-practice.jpg' },
              { name: 'First Aid', desc: 'Bleeding control, burns, fractures, allergic reactions', img: '/images/courses/first-aid.jpg' },
              { name: 'BLS for Healthcare', desc: 'Basic Life Support for healthcare professionals', img: '/images/healthcare/cpr-certification-group.jpg' },
            ].map((p) => (
              <div key={p.name} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-slate-500 text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-full h-[200px] sm:w-72 sm:h-[280px] rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/images/healthcare/cpr-group-training-session.jpg" alt="CPR training session" fill className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on skills practice with HSI-certified instructors.</p>
              <div className="space-y-2">
                {['Adult, child, and infant CPR techniques', 'AED operation and placement', 'Choking response for all ages', 'Wound care and bleeding control', 'Shock recognition and treatment', 'Emergency scene assessment', 'When and how to call 911'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Who Needs CPR Certification</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Healthcare Workers', 'Teachers & Coaches', 'Childcare Providers', 'Construction Workers', 'Fitness Trainers', 'Office Staff', 'Parents', 'Anyone'].map((e) => (
              <div key={e} className="bg-slate-50 rounded-lg px-4 py-3 text-slate-700 font-medium text-sm text-center">{e}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Register Online', desc: 'Choose your class date and sign up.' },
              { step: '2', title: 'Attend Class', desc: 'One-day in-person training session.' },
              { step: '3', title: 'Get Certified', desc: 'Receive your HSI certification card same day.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Get CPR Certified Today</h2>
          <p className="text-white/90 mb-6 text-sm">Same-day certification. Individual and group classes available.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=cpr-first-aid" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-red-50 transition-colors text-center">
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
