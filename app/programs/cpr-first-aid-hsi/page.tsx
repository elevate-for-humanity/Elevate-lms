import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import RequestMeeting from '@/components/RequestMeeting';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'CPR & First Aid Certification | HSI Certified | Elevate',
  description: 'CPR, AED, and First Aid certification in Indianapolis. HSI certified. Same-day certification. Individual and group classes. BLS for healthcare providers.',
  alternates: { canonical: `${SITE_URL}/programs/cpr-first-aid-hsi` },
  openGraph: {
    title: 'CPR & First Aid Certification | HSI Certified',
    description: 'Same-day CPR, AED, and First Aid certification. HSI certified. Individual and group classes.',
    url: `${SITE_URL}/programs/cpr-first-aid-hsi`,
    images: [{ url: `${SITE_URL}/images/programs/cpr-certification-group-hd.jpg`, width: 1600, height: 900 }],
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

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/programs/cpr-certification-group-hd.jpg" alt="CPR & First Aid Certification" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Same-Day Certification</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">CPR &amp; First Aid Certification</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              HSI certified CPR, AED, and First Aid training. Get certified in one day. Individual and group classes available in Indianapolis.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* About */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">About This Certification</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            This is a one-day, in-person certification course taught by HSI (Health & Safety Institute) certified instructors. You learn CPR, AED use, and First Aid through hands-on practice with manikins and training equipment — not just watching videos.
          </p>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            Your certification is valid for 2 years and is accepted by employers, schools, and licensing boards nationwide. HSI is one of the largest AHA-alternative certification providers in the country.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            We offer individual classes on a regular schedule and group/corporate training at your location. BLS (Basic Life Support) for healthcare providers is also available.
          </p>
        </div>
      </section>

      {/* Courses Offered */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Courses Offered</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: 'CPR & AED',
                desc: 'Adult, child, and infant CPR. AED operation and placement. Choking response for all ages.',
                img: '/images/healthcare/cpr-individual-practice.jpg',
                duration: '3–4 hours',
              },
              {
                name: 'First Aid',
                desc: 'Bleeding control, burns, fractures, allergic reactions, shock, and emergency scene assessment.',
                img: '/images/courses/first-aid.jpg',
                duration: '3–4 hours',
              },
              {
                name: 'BLS for Healthcare',
                desc: 'Basic Life Support for healthcare professionals. Meets clinical and licensing requirements.',
                img: '/images/healthcare/cpr-certification-group.jpg',
                duration: '4–5 hours',
              },
            ].map((p) => (
              <div key={p.name} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image src={p.img} alt={p.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{p.name}</h3>
                  <p className="text-slate-600 text-base mb-2">{p.desc}</p>
                  <span className="text-slate-500 text-sm">{p.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">What You&apos;ll Learn</h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              'Adult, child, and infant CPR techniques',
              'AED operation and electrode placement',
              'Choking response for all ages',
              'Wound care and bleeding control',
              'Burn treatment and fracture stabilization',
              'Allergic reaction and anaphylaxis response',
              'Shock recognition and treatment',
              'Emergency scene assessment and 911 protocols',
              'Recovery position and patient monitoring',
              'Bloodborne pathogen awareness',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-base">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Needs This */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Who Needs CPR & First Aid Certification?</h2>
          <p className="text-slate-600 text-base text-center mb-6 max-w-2xl mx-auto">
            Many employers and licensing boards require CPR/First Aid certification. Even if it&apos;s not required for your job, knowing how to respond in an emergency can save a life.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Healthcare Workers', 'Teachers & Coaches', 'Childcare Providers', 'Construction Workers', 'Fitness Trainers', 'Office Staff', 'Parents & Caregivers', 'Anyone'].map((e) => (
              <div key={e} className="bg-white rounded-lg px-4 py-3 text-slate-700 font-medium text-base text-center border border-slate-200">{e}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Individual Classes</h3>
              <p className="text-slate-600 text-base mb-3">Join a scheduled class at our Indianapolis training center.</p>
              <div className="space-y-2">
                {[
                  { course: 'CPR & AED', price: 'Contact for pricing' },
                  { course: 'First Aid', price: 'Contact for pricing' },
                  { course: 'CPR + First Aid Combo', price: 'Contact for pricing' },
                  { course: 'BLS for Healthcare', price: 'Contact for pricing' },
                ].map((c) => (
                  <div key={c.course} className="flex justify-between items-center">
                    <span className="text-slate-700 text-base">{c.course}</span>
                    <span className="text-slate-900 font-semibold text-base">{c.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Group & Corporate Training</h3>
              <p className="text-slate-600 text-base mb-3">We come to your location. Discounted rates for groups of 6 or more.</p>
              <div className="space-y-2">
                {[
                  'On-site training at your workplace',
                  'Flexible scheduling — days, evenings, weekends',
                  'Volume discounts for large groups',
                  'Custom courses for your industry',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-sm text-center mt-4">
            Funding may be available through your employer or workforce program. Contact us for details.
          </p>
        </div>
      </section>

      {/* How to Enroll */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Choose Your Course', desc: 'Select CPR & AED, First Aid, the combo, or BLS for Healthcare.' },
              { step: '2', title: 'Register Online', desc: 'Submit your registration. No prerequisites required for CPR & First Aid. BLS requires healthcare affiliation.' },
              { step: '3', title: 'Attend Class', desc: 'Show up to your scheduled class. All equipment and materials are provided. Wear comfortable clothing.' },
              { step: '4', title: 'Get Certified', desc: 'Pass the skills check and written test. Receive your HSI certification card the same day.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-white rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{s.title}</h3>
                  <p className="text-slate-600 text-base">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How long is the class?', a: 'CPR & AED is about 3–4 hours. First Aid is 3–4 hours. The combo course is a full day (6–8 hours). BLS for Healthcare is 4–5 hours.' },
              { q: 'How long is the certification valid?', a: 'Your HSI certification is valid for 2 years from the date of your class.' },
              { q: 'Is HSI certification accepted by employers?', a: 'Yes. HSI is one of the largest certification providers in the US. Their certifications are accepted by employers, schools, licensing boards, and regulatory agencies nationwide.' },
              { q: 'Do I need any experience or prerequisites?', a: 'No prerequisites for CPR & First Aid. BLS for Healthcare is designed for healthcare professionals but has no formal prerequisites.' },
              { q: 'What should I bring to class?', a: 'Just yourself. All equipment, manikins, and materials are provided. Wear comfortable clothing you can kneel in.' },
              { q: 'Do you offer group or corporate training?', a: 'Yes. We can train your team at your location. Groups of 6 or more receive discounted rates. Contact us to schedule.' },
              { q: 'Can I use funding to pay for this?', a: 'Some workforce programs and employers cover CPR/First Aid training. Contact us or check with your employer to see if funding is available for you.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-base mb-2">{faq.q}</h3>
                <p className="text-slate-600 text-base">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meeting */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <RequestMeeting context="Need to schedule a group class or have questions about which course is right for you? Schedule a free meeting with our team." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Get CPR & First Aid Certified</h2>
          <p className="text-white/90 mb-6 text-base">Same-day certification. Individual and group classes available.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=cpr-first-aid" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-red-50 transition-colors text-center">
              Register Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/contact" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Contact Us for Group Rates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
