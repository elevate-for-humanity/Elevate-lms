
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import RequestMeeting from '@/components/RequestMeeting';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Earn While You Learn | Elevate',
  description: 'Apprenticeship programs in Indianapolis. Barber, cosmetology, culinary, and nail technician. Earn while you learn — get paid during training. JRI and WIOA funding available.',
  alternates: { canonical: `${SITE_URL}/programs/apprenticeships` },
  openGraph: {
    title: 'Apprenticeship Programs | Earn While You Learn',
    description: 'Get paid during your training. US Department of Labor registered apprenticeships.',
    url: `${SITE_URL}/programs/apprenticeships`,
    images: [{ url: `${SITE_URL}/images/hero/hero-hands-on-training.jpg`, width: 1400, height: 933 }],
  },
};

export default function ApprenticeshipsPage() {

  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/program-hero.mp4" voiceoverSrc="/audio/heroes/programs.mp3" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/hero/hero-hands-on-training.jpg" alt="Apprenticeship Programs" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Stats */}
      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '4 Programs', label: 'Available Now' },
            { val: 'Paid', label: 'During Training' },
            { val: '$0', label: 'With Funding' },
            { val: 'DOL', label: 'Registered' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg sm:text-xl font-bold text-white">{s.val}</div>
              <div className="text-slate-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What Is an Apprenticeship */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">What Is an Apprenticeship?</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            An apprenticeship is an alternative to traditional school. Instead of paying tuition to sit in a classroom, you train at a real workplace under a licensed professional. You learn by doing real work from day one — and you get paid while you learn.
          </p>
          <p className="text-slate-700 text-base leading-relaxed mb-4">
            All of our apprenticeship programs are registered with the U.S. Department of Labor and approved by the State of Indiana. When you complete your hours and pass the required exams, you earn the same license or certification as someone who went through a traditional school — but without the tuition debt.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Funding is available through JRI (Justice Reinvestment Initiative), WIOA, and WRG for qualifying students. Many apprentices pay nothing out of pocket.
          </p>
        </div>
      </section>

      {/* Choose Your Apprenticeship */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Apprenticeship</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', img: '/images/barber-hero-new.jpg', duration: '18 months / 1,500 hours', desc: 'Train in a real barbershop. Learn cuts, fades, shaves, and business skills. Earn your Indiana barber license.' },
              { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship', img: '/images/beauty/hero-program-cosmetology.jpg', duration: '18 months / 1,500 hours', desc: 'Hair styling, coloring, chemical treatments, and salon management. Earn your Indiana cosmetology license.' },
              { name: 'Culinary Apprenticeship', href: '/programs/culinary-apprenticeship', img: '/images/culinary/hero-program-culinary.jpg', duration: '6–12 months', desc: 'Kitchen skills, food safety, menu planning, and restaurant operations. Train in a real commercial kitchen.' },
              { name: 'Nail Technician Apprenticeship', href: '/programs/nail-technician-apprenticeship', img: '/images/programs/efh-esthetician-client-services-card.jpg', duration: '6–9 months', desc: 'Manicure, pedicure, acrylics, gel nails, and nail art. Earn your Indiana nail technician license.' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 50vw" />
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

      {/* Why Apprenticeship */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Why Choose an Apprenticeship?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Get Paid While You Train', desc: 'You earn money from day one. The apprenticeship is your job — you train and earn at the same time.' },
              { title: 'No Tuition With Funding', desc: 'JRI, WIOA, and WRG funding can cover the full cost. Many apprentices pay $0 out of pocket.' },
              { title: 'Real Workplace Experience', desc: 'You train at a real business with real clients — not in a classroom. You build skills and a client base before you graduate.' },
              { title: 'Same License at the End', desc: 'You earn the same state license or certification as someone who went through traditional school.' },
              { title: 'DOL Registered', desc: 'All programs are registered with the U.S. Department of Labor — a nationally recognized credential.' },
              { title: 'Job-Ready on Day One', desc: 'When you finish, you already have workplace experience, a client base, and employer connections.' },
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
            <p className="text-slate-600 text-base mb-4">Requirements vary by program. These are the general minimums across all apprenticeships:</p>
            <div className="space-y-3">
              {[
                { req: 'Age', detail: 'At least 16 years old (18+ recommended)' },
                { req: 'Education', detail: 'High school diploma or GED (or currently enrolled)' },
                { req: 'Experience', detail: 'No prior experience needed — all programs train from scratch' },
                { req: 'Background', detail: 'Background check required. A criminal record does not automatically disqualify you — JRI participants welcome.' },
                { req: 'Transportation', detail: 'Reliable transportation to your assigned training location in Indianapolis' },
                { req: 'Commitment', detail: 'Able to commit to a consistent schedule for the program duration (6–18 months)' },
              ].map((r) => (
                <div key={r.req} className="flex items-start gap-3">
                  <span className="font-bold text-slate-900 text-base w-32 flex-shrink-0">{r.req}</span>
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
              { step: '1', title: 'Apply Online', desc: 'Submit your application — it takes about 5 minutes. No fee to apply.' },
              { step: '2', title: 'Check Funding Eligibility', desc: 'Register at indianacareerconnect.com and schedule a WorkOne appointment. They determine if you qualify for JRI, WIOA, or WRG funding. This takes 1–3 weeks.' },
              { step: '3', title: 'Get Matched', desc: 'Once approved, we match you with a licensed instructor at a real workplace near you.' },
              { step: '4', title: 'Start Training & Earning', desc: 'Begin your hands-on training. You work with real clients and get paid while you learn.' },
              { step: '5', title: 'Get Licensed', desc: 'Complete your required hours, pass the state exam, and receive your license or certification.' },
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
              { q: 'Do I need experience to apply?', a: 'No. All apprenticeship programs are designed for beginners. Your instructor teaches you everything from scratch.' },
              { q: 'How much does it cost?', a: 'If you qualify for JRI, WIOA, or WRG funding, the program is free. Self-pay options with payment plans are also available.' },
              { q: 'Will I actually get paid during training?', a: 'Yes. You earn money while training at your assigned workplace. The amount depends on your program and workplace arrangement.' },
              { q: 'What if I have a criminal record?', a: 'A criminal record does not automatically disqualify you. JRI funding is specifically designed for justice-involved individuals.' },
              { q: 'How do I check if I qualify for funding?', a: 'Register at indianacareerconnect.com and schedule an appointment with WorkOne. They determine your eligibility. This is free and takes about 1–3 weeks.' },
              { q: 'Which apprenticeship should I choose?', a: 'It depends on your interests. Barber and cosmetology are 18-month programs. Culinary and nail tech are shorter (6–12 months). Click on any program above to see full details.' },
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
          <RequestMeeting context="Not sure which apprenticeship is right for you? Schedule a free meeting with an advisor to discuss your options." />
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Apprenticeship</h2>
          <p className="text-white/90 mb-6 text-base">Apply in 5 minutes. No application fee. Funding available for qualifying students.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=apprenticeship" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-red-50 transition-colors text-center">
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
