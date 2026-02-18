import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import RequestMeeting from '@/components/RequestMeeting';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Micro Programs | Short-Term Certifications | Elevate',
  description: 'Short-term certification programs in Indianapolis. CPR, First Aid, sanitation, food handler, OSHA, forklift, and more. Get certified in days, not months.',
  alternates: { canonical: `${SITE_URL}/programs/micro-programs` },
  openGraph: {
    title: 'Micro Programs | Short-Term Certifications',
    description: 'Get certified in days, not months. CPR, First Aid, sanitation, OSHA, forklift, and more.',
    url: `${SITE_URL}/programs/micro-programs`,
    images: [{ url: `${SITE_URL}/images/hero/hero-certifications.jpg`, width: 1400, height: 933 }],
  },
};

export default function MicroProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Micro Programs' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/hero/hero-certifications.jpg" alt="Micro Programs — Short-Term Certifications" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Quick Certifications</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Micro Programs</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Short-term certifications you can complete in days, not months. Get the credentials you need to start working or advance your career.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '6+', label: 'Certifications' },
            { val: '1–14 Days', label: 'Completion Time' },
            { val: 'Same Day', label: 'Some Certs' },
            { val: 'Nationally', label: 'Recognized' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What Are Micro Programs */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">What Are Micro Programs?</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            Micro programs are short-term certification courses that take days instead of months. They give you a specific, employer-recognized credential — like CPR certification, food handler card, OSHA safety card, or forklift license — that you can use immediately.
          </p>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            These are not full career training programs. They are targeted certifications that either qualify you for a specific job, meet an employer requirement, or add a credential to your resume. Many employers require one or more of these certifications as a condition of employment.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Some micro programs may be covered by workforce funding. Others are self-pay with affordable pricing. Contact us to check what options are available for you.
          </p>
        </div>
      </section>

      {/* Available Certifications */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Available Certifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'CPR & First Aid',
                href: '/programs/cpr-first-aid-hsi',
                img: '/images/programs/cpr-group-training-hd.jpg',
                duration: '1 day',
                desc: 'HSI certified CPR, AED, and First Aid. Same-day certification. Individual and group classes.',
              },
              {
                name: 'Sanitation & Infection Control',
                href: '/programs/sanitation-infection-control',
                img: '/images/healthcare/emergency-safety.jpg',
                duration: '1–2 weeks',
                desc: 'Infection prevention, sanitation protocols, and workplace safety for healthcare and food service.',
              },
              {
                name: 'Food Handler',
                href: '/programs/culinary-apprenticeship',
                img: '/images/culinary/program-culinary-overview.jpg',
                duration: '1 day',
                desc: 'Food safety, handling, storage, and preparation. Required for most food service jobs in Indiana.',
              },
              {
                name: 'OSHA 10/30',
                href: '/programs/skilled-trades',
                img: '/images/heroes/resource-3.jpg',
                duration: '1–4 days',
                desc: 'OSHA safety certification for construction and general industry. 10-hour and 30-hour courses available.',
              },
              {
                name: 'Forklift Certification',
                href: '/programs/skilled-trades',
                img: '/images/trades/hero-program-carpentry.jpg',
                duration: '1 day',
                desc: 'Powered industrial truck (forklift) operator certification. Hands-on training and written test.',
              },
              {
                name: 'Bloodborne Pathogens',
                href: '/programs/sanitation-infection-control',
                img: '/images/healthcare/hero-programs-healthcare.jpg',
                duration: '1 day',
                desc: 'OSHA-compliant bloodborne pathogen training. Required for healthcare, tattoo, and body art professionals.',
              },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{p.name}</h3>
                  <p className="text-slate-600 text-base mb-2">{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-sm">{p.duration}</span>
                    <span className="text-brand-blue-600 font-semibold text-sm group-hover:underline">Learn More →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Micro Programs */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Why Get a Micro Certification?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Fast Completion', desc: 'Most certifications take 1 day. The longest takes 2 weeks. You can start and finish quickly.' },
              { title: 'Employer Required', desc: 'Many jobs require specific certifications before you can start. These get you qualified fast.' },
              { title: 'Nationally Recognized', desc: 'HSI, OSHA, and other nationally recognized certifying bodies. Accepted by employers everywhere.' },
              { title: 'Stack Your Credentials', desc: 'Add multiple certifications to your resume. Each one makes you more competitive and more employable.' },
              { title: 'Affordable', desc: 'Short courses mean lower costs. Some may be covered by workforce funding or your employer.' },
              { title: 'Hands-On Training', desc: 'In-person classes with real equipment. You practice the skills, not just read about them.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-1">{item.title}</h3>
                <p className="text-slate-600 text-base">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">General Requirements</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-slate-600 text-base mb-4">Requirements vary by certification. These are the general minimums:</p>
            <div className="space-y-3">
              {[
                { req: 'Age', detail: 'At least 16 years old (some certifications require 18+)' },
                { req: 'Education', detail: 'No degree required for most certifications' },
                { req: 'Experience', detail: 'No prior experience needed — all courses train from scratch' },
                { req: 'Language', detail: 'Classes taught in English. Basic English comprehension required for written tests.' },
                { req: 'Physical', detail: 'Some courses (CPR, forklift) require kneeling, lifting, or physical activity' },
              ].map((r) => (
                <div key={r.req} className="flex items-start gap-3">
                  <span className="font-bold text-slate-900 text-base w-28 flex-shrink-0">{r.req}</span>
                  <span className="text-slate-700 text-base">{r.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Enroll */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Choose Your Certification', desc: 'Pick the certification you need from the list above. Click on any card to see full details.' },
              { step: '2', title: 'Register Online', desc: 'Submit your registration. Select your preferred class date. No application fee.' },
              { step: '3', title: 'Check Funding (Optional)', desc: 'Some certifications may be covered by workforce programs or your employer. Contact us to check.' },
              { step: '4', title: 'Attend Class', desc: 'Show up to your scheduled class. All equipment and materials are provided.' },
              { step: '5', title: 'Get Certified', desc: 'Pass the skills check and/or written test. Most certifications are issued same day.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
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
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'How long do micro programs take?', a: 'Most take 1 day. OSHA 30 takes 4 days. Sanitation & Infection Control takes 1–2 weeks. Check each program page for exact duration.' },
              { q: 'How much do they cost?', a: 'Pricing varies by certification. Some may be covered by workforce funding or your employer. Contact us for current pricing.' },
              { q: 'Are these certifications recognized by employers?', a: 'Yes. All certifications are issued by nationally recognized bodies (HSI, OSHA, etc.) and accepted by employers, schools, and licensing boards.' },
              { q: 'Do I need experience to take a class?', a: 'No. All micro programs are designed for beginners. Your instructor teaches everything from scratch.' },
              { q: 'Can I take multiple certifications?', a: 'Yes. Many students stack certifications to become more competitive. You can take them one at a time on your own schedule.' },
              { q: 'Do you offer group or corporate training?', a: 'Yes. We offer on-site training at your workplace for groups of 6 or more. Contact us to schedule.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-slate-200 p-5">
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
          <RequestMeeting context="Not sure which certification you need? Schedule a free meeting with our team to discuss your goals and requirements." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Get Certified Fast</h2>
          <p className="text-white/90 mb-6 text-base">Same-day certifications available. Register today and start building your credentials.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=micro-programs" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-red-50 transition-colors text-center">
              Register Now <ArrowRight className="w-4 h-4 inline ml-1" />
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
