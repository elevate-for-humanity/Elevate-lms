import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Clock, DollarSign, Award, Users, MapPin } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const metadata: Metadata = {
  title: 'CNA Program — Certified Nursing Assistant | Elevate for Humanity',
  description: 'Indiana state CNA certification in 6 weeks. Clinical rotations at licensed healthcare facilities. State exam proctored on-site. WIOA and Workforce Ready Grant funding available.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cna' },
};

const OUTCOMES = [
  { icon: Clock, label: 'Program Length', value: '6 Weeks' },
  { icon: DollarSign, label: 'Starting Salary', value: '$30K–$42K/yr' },
  { icon: Award, label: 'Credential', value: 'Indiana State CNA' },
  { icon: Users, label: 'Class Size', value: 'Small cohorts' },
  { icon: MapPin, label: 'Location', value: 'Indianapolis, IN' },
  { icon: DollarSign, label: 'Tuition', value: '$0 for eligible participants' },
];

const CURRICULUM = [
  {
    week: 'Weeks 1–2', title: 'Foundations of Patient Care',
    topics: ['Infection control & hand hygiene', 'Patient rights & dignity', 'Safety, body mechanics & positioning', 'Vital signs: temperature, pulse, respiration, blood pressure'],
  },
  {
    week: 'Weeks 3–4', title: 'Clinical Skills',
    topics: ['Personal care: bathing, grooming, oral hygiene', 'Feeding assistance & nutrition', 'Catheter care & elimination', 'Range of motion & ambulation assistance'],
  },
  {
    week: 'Weeks 5–6', title: 'Clinical Rotations & State Exam Prep',
    topics: ['Supervised clinical rotations at licensed healthcare facilities', 'Documentation and reporting', 'Indiana state CNA exam — proctored on-site', 'Job placement support'],
  },
];

const FUNDING = [
  { name: 'WIOA', tag: 'Federal', desc: 'Covers tuition, books, and exam fees for eligible adults, dislocated workers, and youth 16–24.' },
  { name: 'Workforce Ready Grant', tag: 'Indiana State', desc: 'Indiana state grant for high-demand healthcare programs. No cost for eligible participants.' },
  { name: 'Job Ready Indy', tag: 'Indiana State', desc: 'Funded training for eligible justice-involved individuals through Indiana DWD.' },
];

const FAQ = [
  { q: 'When will CNA cohorts begin?', a: 'Elevate for Humanity anticipates CNA cohorts beginning in October. Join the waitlist to receive official enrollment updates as dates are confirmed.' },
  { q: 'Can I enroll right now?', a: 'Enrollment opens when a cohort is confirmed. Join the waitlist to be first in line and receive step-by-step enrollment instructions.' },
  { q: 'Is the state exam included?', a: 'Yes. The Indiana state CNA certification exam is proctored on-site at the end of the program. No separate testing center visit required.' },
  { q: 'Do I need prior healthcare experience?', a: 'No prior experience is required. The program is designed for adults entering healthcare for the first time.' },
  { q: 'What funding is available?', a: 'WIOA, Workforce Ready Grant, and Job Ready Indy funding may cover 100% of tuition, books, and exam fees for eligible Indiana residents. We help you apply.' },
];

export default function CNAPage() {
  const b = heroBanners['cna'];
  return (
    <main className="min-h-screen bg-white">

      {/* HERO — CNA video + CNA poster image */}
      <HeroVideo
        videoSrcDesktop={b.videoSrcDesktop}
        posterImage={b.posterImage}
        voiceoverSrc={b.voiceoverSrc}
        microLabel={b.microLabel}
        analyticsName={b.analyticsName}
        belowHeroHeadline={b.belowHeroHeadline}
        belowHeroSubheadline={b.belowHeroSubheadline}
        ctas={[
          { label: 'Join the Waitlist', href: '/cna-waitlist', variant: 'primary' },
          { label: 'Check Funding', href: '/start', variant: 'secondary' },
        ]}
        trustIndicators={b.trustIndicators}
        transcript={b.transcript}
      />

      {/* OUTCOMES STRIP */}
      <div className="bg-slate-950 border-b border-slate-800 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
          {OUTCOMES.map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <Icon className="w-5 h-5 text-brand-blue-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-white font-bold text-sm leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRAM OVERVIEW */}
      <section className="py-16 px-6 border-b border-slate-100">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Program Overview</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-5">
              Indiana CNA Certification — 6 weeks, state exam on-site.
            </h2>
            <p className="text-black text-base leading-relaxed mb-5">
              Elevate&apos;s CNA program prepares you for the Indiana state Certified Nursing Assistant exam in 6 weeks. You&apos;ll complete supervised clinical rotations at licensed healthcare facilities and sit for the state exam on-site — no separate testing center required.
            </p>
            <p className="text-black text-base leading-relaxed mb-8">
              CNAs are in high demand across Indiana hospitals, nursing homes, and home health agencies. Most Elevate CNA graduates receive job offers before or immediately after completing the program.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Indiana state CNA exam proctored on-site',
                'Clinical rotations at licensed healthcare facilities',
                'WIOA and Workforce Ready Grant funding available',
                'Small cohorts — personalized instruction',
                'Job placement support included',
                'No prior healthcare experience required',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/cna-waitlist" className="inline-block bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-8 py-4 rounded-xl transition-colors">
              Join the CNA Waitlist
            </Link>
          </div>
          <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden shadow-xl">
            <Image
              src="/images/pages/cna-clinical.jpg"
              alt="CNA student in clinical training"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 20%' }}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="py-16 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Curriculum</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-10">What you&apos;ll learn</h2>
          <div className="space-y-6">
            {CURRICULUM.map((block) => (
              <div key={block.week} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-brand-blue-700 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">{block.week}</span>
                  <h3 className="font-extrabold text-slate-900 text-base">{block.title}</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {block.topics.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-black">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-blue-500 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDING */}
      <section className="py-16 px-6 bg-brand-blue-700 border-b border-brand-blue-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Funding</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Most participants pay $0.</h2>
          <p className="text-white text-base leading-relaxed mb-8 max-w-2xl">
            Federal and Indiana state workforce funding may cover 100% of tuition, books, and exam fees. We help you apply for every option you qualify for.
          </p>
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {FUNDING.map((f) => (
              <div key={f.name} className="bg-white/10 rounded-xl p-5">
                <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">{f.tag}</p>
                <h3 className="text-white font-bold text-base mb-2">{f.name}</h3>
                <p className="text-white text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/start" className="bg-white text-brand-blue-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-blue-50 transition-colors">Check My Eligibility</Link>
            <Link href="/funding" className="border border-white/30 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors">All Funding Options</Link>
          </div>
        </div>
      </section>

      {/* PHOTO STRIP */}
      <section className="py-16 px-6 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-3">Program Photos</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Inside the CNA Program</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { src: '/images/pages/cna-patient-care.jpg', alt: 'CNA patient care',     pos: 'center 30%' },
              { src: '/images/pages/cna-vitals.jpg',       alt: 'CNA taking vitals',    pos: 'center 20%' },
              { src: '/images/pages/cna-nursing-real.jpg', alt: 'CNA nursing skills',   pos: 'center 25%' },
              { src: '/images/pages/cna-nursing.jpg',      alt: 'CNA clinical training',pos: 'center 20%' },
            ].map((img) => (
              <div key={img.src} className="relative rounded-xl overflow-hidden aspect-[3/2]">
                <Image src={img.src} alt={img.alt} fill className="object-cover" style={{ objectPosition: img.pos }} sizes="(max-width: 640px) 50vw, 25vw" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-slate-50 border-b border-slate-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand-blue-600 text-xs font-bold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{q}</h3>
                <p className="text-black text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-400 mb-4">Get Started</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5">
            Ready to become a Certified Nursing Assistant?
          </h2>
          <p className="text-white text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Join the waitlist for the next CNA cohort. Training may be fully funded. State exam included.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/cna-waitlist" className="bg-brand-blue-700 hover:bg-brand-blue-800 text-white font-bold px-10 py-4 rounded-xl transition-colors text-lg">
              Join the CNA Waitlist
            </Link>
            <Link href="/start" className="border border-slate-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-slate-800 transition-colors text-lg">
              Check Funding
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
