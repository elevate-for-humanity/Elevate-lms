import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Peer Recovery Specialist Training | JRI Funded | Elevate',
  description: 'Become a certified Peer Recovery Specialist. JRI-funded training for justice-involved individuals in Indiana. Help others overcome addiction and reenter the workforce.',
  alternates: { canonical: `${SITE_URL}/programs/peer-recovery-specialist` },
  openGraph: {
    title: 'Peer Recovery Specialist | Elevate for Humanity',
    description: 'JRI-funded peer recovery training in Indianapolis.',
    url: `${SITE_URL}/programs/peer-recovery-specialist`,
    images: [{ url: `${SITE_URL}/images/heroes-hq/career-services-hero.jpg`, width: 1200, height: 630 }],
  },
};

export default function PeerRecoverySpecialistPage() {
  return (
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/program-hero.mp4" voiceoverSrc="/audio/heroes/programs.mp3" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Social Services', href: '/programs' }, { label: 'Peer Recovery Specialist' }]} />
        </div>
      </div>

      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/heroes-hq/career-services-hero.jpg" alt="Peer Recovery Specialist training session" fill sizes="100vw" className="object-cover" priority />
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '8-12 Weeks', label: 'Program Length' },
            { val: 'ICRC Prep', label: 'Certification' },
            { val: '$32K-$48K', label: 'Salary Range' },
            { val: 'High Demand', label: 'Job Market' },
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Peer Recovery Specialist Training</h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            The Peer Recovery Specialist program trains individuals with lived experience in addiction recovery to support others through the recovery process. This program is aligned with Indiana Counselors Association on Alcohol and Drug Abuse (ICAADA) and Indiana Certification Board (ICRC) standards. JRI funding may cover the full cost for eligible justice-involved participants.
          </p>
          <h2 className="text-xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
          <div className="space-y-2">
            {['Recovery coaching fundamentals and ethics', 'Motivational interviewing techniques', 'Crisis intervention and de-escalation', 'Trauma-informed care principles', 'Substance use disorder education', 'Community resource navigation and referrals', 'Group facilitation and peer support', 'Documentation and case management basics', 'Cultural competency in recovery services', 'Relapse prevention planning'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-green-600 rounded-full flex-shrink-0" />
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
              { title: 'Peer Recovery Coach', salary: '$30K-$40K' },
              { title: 'Recovery Specialist', salary: '$35K-$48K' },
              { title: 'Case Manager', salary: '$38K-$52K' },
              { title: 'Program Coordinator', salary: '$42K-$58K' },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                <div className="text-brand-green-600 font-bold text-sm">{c.salary}</div>
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
              { step: '1', title: 'Apply Online', desc: 'Submit your student application and indicate interest in Peer Recovery.' },
              { step: '2', title: 'Check Funding', desc: 'JRI funding may cover the full cost. Register at indianacareerconnect.com.' },
              { step: '3', title: 'Complete Training', desc: 'Classroom instruction, role-play exercises, and supervised field experience.' },
              { step: '4', title: 'Get Certified', desc: 'Prepare for ICRC Peer Recovery certification and connect with employers.' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-4 bg-slate-50 rounded-lg p-4">
                <div className="w-8 h-8 bg-brand-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{s.step}</div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-green-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Help Others Recover. Start Your Career.</h2>
          <p className="text-white/90 mb-6 text-sm">JRI-funded training available for eligible participants. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=peer-recovery-specialist" className="bg-white text-brand-green-700 font-bold px-6 py-3 rounded-lg text-base hover:bg-green-50 transition-colors text-center">
              Apply Now →
            </Link>
            <Link href="/funding/jri" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              JRI Funding Info
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
