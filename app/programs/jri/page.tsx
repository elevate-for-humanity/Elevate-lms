
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'JRI Programs | Justice Reinvestment Initiative | Elevate',
  description: 'JRI career training in Indianapolis. Earn while you learn. Tuition, supplies, and certification covered for qualifying individuals.',
  alternates: { canonical: `${SITE_URL}/programs/jri` },
  openGraph: {
    title: 'JRI Programs | Justice Reinvestment Initiative',
    description: 'Earn while you learn — JRI covers tuition for qualifying individuals.',
    url: `${SITE_URL}/programs/jri`,
    images: [{ url: `${SITE_URL}/images/heroes-hq/jri-hero.jpg`, width: 1200, height: 630 }],
  },
};

export default function JRIPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'JRI Programs' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/heroes-hq/jri-hero.jpg" alt="JRI Programs" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Earn While You Learn</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">JRI Programs</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Justice Reinvestment Initiative — career training with tuition, supplies, and certification fees covered for qualifying individuals.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: 'Tuition Covered', label: 'For Qualifying' },
            { val: 'Paid Training', label: 'Earn While You Learn' },
            { val: 'Certifications', label: 'Included' },
            { val: 'Job Placement', label: 'Assistance' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What JRI Covers</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-3">The Justice Reinvestment Initiative provides workforce training and support for justice-involved individuals re-entering the workforce.</p>
          <div className="space-y-2">
            {['Tuition and training fees', 'Books, supplies, and uniforms', 'Certification and exam fees', 'Transportation assistance', 'Case management and mentoring', 'Job placement and career coaching', 'Supportive services (childcare, housing referrals)'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Eligible Programs</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { name: 'Healthcare', href: '/programs/healthcare', img: '/images/hero/hero-healthcare.jpg' },
              { name: 'Skilled Trades', href: '/programs/skilled-trades', img: '/images/hero/hero-community.jpg' },
              { name: 'CDL Training', href: '/programs/cdl-training', img: '/images/hero/hero-community.jpg' },
              { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', img: '/images/barber-hero-new.jpg' },
              { name: 'Technology', href: '/programs/technology', img: '/images/hero/hero-tech-careers.jpg' },
              { name: 'Culinary', href: '/programs/culinary-apprenticeship', img: '/images/culinary/hero-program-culinary.jpg' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 33vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center">JRI Workforce Readiness Modules</h2>
          <p className="text-slate-600 text-sm text-center mb-6">SCORM 2004 badge modules delivered through the Elevate LMS. Complete all badges to earn your JRI Workforce Readiness credential.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { badge: '0', title: 'Introduction to JRI', desc: 'Program overview, expectations, and goal-setting.', time: '30 min' },
              { badge: '1', title: 'Badge 1: Mindsets', desc: 'Growth mindset, resilience, and professional attitude.', time: '45 min' },
              { badge: '2', title: 'Badge 2: Self-Management', desc: 'Time management, attendance, and personal accountability.', time: '45 min' },
              { badge: '3', title: 'Badge 3: Learning Strategies', desc: 'Study skills, note-taking, and test preparation.', time: '45 min' },
              { badge: '4', title: 'Badge 4: Social Skills', desc: 'Communication, teamwork, and conflict resolution.', time: '45 min' },
              { badge: '5', title: 'Badge 5: Workplace Skills', desc: 'Professionalism, safety, and employer expectations.', time: '45 min' },
              { badge: '6', title: 'Badge 6: Launch a Career', desc: 'Resume building, interviews, and career planning.', time: '45 min' },
            ].map((m) => (
              <div key={m.badge} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{m.badge}</span>
                  <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                </div>
                <p className="text-slate-600 text-xs mb-2">{m.desc}</p>
                <span className="text-xs text-slate-500">{m.time}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">Modules are accessed through the student portal after enrollment. Progress is tracked automatically.</p>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Register Online', desc: 'Create an account at indianacareerconnect.com.' },
              { step: '2', title: 'Schedule WorkOne Appointment', desc: 'Meet with a counselor to determine JRI eligibility.' },
              { step: '3', title: 'Choose Your Program', desc: 'Select from JRI-eligible training programs.' },
              { step: '4', title: 'Start Training', desc: 'Begin your funded career training and earn while you learn.' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your New Career</h2>
          <p className="text-white mb-6 text-sm">JRI funding available for qualifying individuals. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=jri" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-red-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Register at Indiana Career Connect
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
