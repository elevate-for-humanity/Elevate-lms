import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import HomeHeroVideo from './HomeHeroVideo';
import { PROGRAMS } from '@/lib/programs-data';
import HomeBelowFold from './HomeBelowFold';

export const metadata: Metadata = {
  title: 'Elevate for Humanity | Workforce Credential Institute — Healthcare, Trades, CDL & Technology',
  description: 'Indiana workforce credential institute. Industry-aligned training, nationally recognized certifications (EPA 608, OSHA, WorkKeys NCRC, Certiport), and employer placement partnerships. WIOA and state funding available.',
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ===== NOW ENROLLING BANNER ===== */}
      <div className="bg-brand-green-600 text-white py-2.5 text-center text-sm font-semibold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
          <span>Now Enrolling — Funded Credential Pathway Programs</span>
          <Link href="/apply" className="inline-flex items-center gap-1 bg-white text-brand-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-brand-green-50 transition-colors">
            Check Eligibility →
          </Link>
        </div>
      </div>

      {/* ===== HERO VIDEO ===== */}
      <section className="relative w-full h-[55vh] sm:h-[65vh] md:h-[75vh] lg:h-[85vh] xl:h-[90vh] min-h-[320px] overflow-hidden">
        <HomeHeroVideo />
      </section>

      {/* ===== HERO CTA ===== */}
      <section className="bg-slate-900 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-brand-red-400 font-semibold text-sm uppercase tracking-wider mb-3">Workforce Credential Institute</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08]">
            Industry-Aligned Training.
            <span className="block text-brand-red-400 mt-1">Nationally Recognized Credentials.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed max-w-2xl mx-auto">
            Elevate for Humanity is a workforce credential institute delivering career pathway programs in healthcare, skilled trades, CDL, and technology — each aligned to employer demand and validated by national certifying bodies.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg text-base sm:text-lg transition-all shadow-lg shadow-brand-red-600/30">
              Apply Now
            </Link>
            <Link href="/programs" className="bg-white/15 border border-white/30 text-white font-bold px-8 py-3.5 rounded-lg text-base sm:text-lg hover:bg-white/25 transition-all">
              Credential Pathways
            </Link>
          </div>
        </div>
      </section>

      {/* ===== INSTITUTIONAL TRUST BAR ===== */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mb-4">Institutional Affiliations &amp; Workforce Alignment</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>U.S. Department of Labor — Registered Apprenticeship Sponsor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>Indiana DWD — ETPL Listed Training Provider</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>WorkOne — Workforce Partner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-blue-600 rounded-full" />
              <span>WIOA Title I — Approved Provider</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-green-600 rounded-full" />
              <span>Next Level Jobs — Workforce Ready Grant Eligible</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-slate-500">
            <span>EPA 608 Approved Proctor Testing Site</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-slate-700">
            <span><strong className="text-slate-900">8</strong> Training Programs</span>
            <span><strong className="text-slate-900">35+</strong> Industry Credentials</span>
            <span><strong className="text-slate-900">5</strong> Career Sectors</span>
            <span><strong className="text-slate-900">20+</strong> Employer Partners</span>
            <span className="text-brand-green-700 font-semibold">$0 Tuition with Approved Funding</span>
          </div>
        </div>
      </section>

      {/* ===== AUDIENCE QUICK LINKS ===== */}
      
      <section className="py-10 sm:py-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            How can we help you?
          </h2>
          <p className="text-center text-slate-600 mb-8 max-w-2xl mx-auto">
            Choose your path below. Each option takes you directly to the information you need — everything starts online.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/programs', label: 'I want to train', desc: 'Browse funded programs.', cta: 'Browse Programs', image: '/images/hp/train.jpg', alt: 'Students in a training classroom' },
              { href: '/funding', label: 'I need funding', desc: 'Check your eligibility.', cta: 'Check Eligibility', image: '/images/hp/funding.jpg', alt: 'Funding and financial aid' },
              { href: '/employer', label: "I'm an employer", desc: 'Hire credentialed graduates.', cta: 'Hire Graduates', image: '/images/hp/employer.jpg', alt: 'Employer partnership meeting' },
              { href: '/store', label: 'I run a school', desc: 'License the platform.', cta: 'Get Licensed', image: '/images/hp/school.jpg', alt: 'Training program office' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col bg-white rounded-xl border border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all group overflow-hidden"
              >
                <div className="relative h-24 sm:h-32">
                  <Image src={item.image} alt={item.alt} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 sm:p-4">
                  <span className="font-bold text-sm sm:text-base text-slate-900 block mb-0.5">{item.label}</span>
                  <span className="text-xs text-slate-500 block mb-2">{item.desc}</span>
                  <span className="text-brand-red-600 font-semibold text-xs group-hover:underline">
                    {item.cta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      



      {/* ===== THREE PILLARS ===== */}
      
      <section aria-label="Three pillars" className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Our Model</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Three Pillars of Workforce Readiness</h2>
            <p className="text-base text-slate-700 max-w-3xl mx-auto">Every credential pathway is built on three pillars — trained, certified, and employed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: 'Industry-Aligned Training',
                desc: 'Healthcare, Skilled Trades, CDL, Technology, and Barbering — each mapped to employer hiring requirements and national credentials.',
                href: '/programs',
                cta: 'View Programs',
                image: '/images/hp/choose-program.jpg',
              },
              {
                title: 'National Credential Validation',
                desc: 'EPA 608, OSHA 10/30, WorkKeys NCRC, Certiport, NRF RISE Up, and CPR/First Aid — proctored on-site at our authorized testing center.',
                href: '/credentials',
                cta: 'View Credentials',
                image: '/images/hp/complete-training.jpg',
              },
              {
                title: 'Employer Placement',
                desc: 'Direct hiring pipelines with Indiana employers. WOTC tax credits, OJT wage reimbursement, and Registered Apprenticeship pathways.',
                href: '/employer',
                cta: 'Employer Info',
                image: '/images/hp/candidates.jpg',
              },
            ].map((pillar) => (
              <div key={pillar.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <Image src={pillar.image} alt={pillar.title} width={600} height={400} sizes="(max-width: 768px) 100vw, 33vw" className="w-full aspect-[3/2] object-cover" />
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">{pillar.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{pillar.desc}</p>
                  <Link href={pillar.href} className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
                    {pillar.cta} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      

      {/* ===== FEATURED PROGRAMS ===== */}
      
      <section aria-label="Featured credential programs" className="py-10 sm:py-14 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-brand-red-600 font-bold text-sm mb-2 uppercase tracking-wide">Credential Pathways</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Featured Programs</h2>
            <p className="text-lg text-slate-700 max-w-3xl mx-auto">Each program leads to nationally recognized certifications. Training may be fully funded for eligible participants through WIOA, WRG, and JRI.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROGRAMS.filter(p => p.etplApproved).slice(0, 9).map((program) => (
              <Link
                key={program.slug}
                href={`/programs/${program.slug}`}
                className="flex flex-row sm:flex-col bg-white rounded-xl border border-slate-200 hover:border-brand-red-400 hover:shadow-lg transition-all group overflow-hidden"
              >
                <div className="relative w-28 sm:w-full h-auto sm:h-40 flex-shrink-0">
                  <Image
                    src={program.image}
                    alt={program.name}
                    fill
                    sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-0.5 group-hover:text-brand-red-600 transition-colors">{program.name}</h3>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2 hidden sm:block">{program.blurb}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500">{program.duration}</span>
                    <span className="text-[10px] sm:text-xs font-semibold text-brand-green-600 bg-brand-green-50 px-2 py-0.5 rounded-full">{program.funding}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors shadow-lg shadow-brand-red-600/20">
              View All Programs
            </Link>
            <Link href="/apply/student" className="border-2 border-brand-red-600 text-brand-red-600 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-red-50 transition-colors">
              Apply Now
            </Link>
          </div>
        </div>
      </section>
      



      <HomeBelowFold />
    </main>
  );
}
