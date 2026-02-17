import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import PageAvatar from '@/components/PageAvatar';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship | Earn While You Learn | Elevate',
  description: 'Barber apprenticeship in Indianapolis. Earn while you learn — get paid during training. Licensed barber in 18 months. JRI funding available.',
  alternates: { canonical: `${SITE_URL}/programs/barber-apprenticeship` },
  openGraph: {
    title: 'Barber Apprenticeship | Earn While You Learn',
    description: 'Get paid during your barber apprenticeship. Licensed in 18 months.',
    url: `${SITE_URL}/programs/barber-apprenticeship`,
    images: [{ url: `${SITE_URL}/images/barber-hero-new.jpg`, width: 1200, height: 630 }],
  },
};

export default function BarberApprenticeshipPage() {
  return (
    <>
    <ProgramStructuredData program={{
      id: 'barber-apprenticeship',
      name: 'Barber Apprenticeship Program',
      slug: 'barber-apprenticeship',
      description: 'Earn while you learn barbering through a DOL-registered apprenticeship. 1,500 hours of supervised training with state licensure preparation.',
      duration_weeks: 52,
      price: 0,
      image_url: `${SITE_URL}/images/programs-hq/barber-training.jpg`,
      category: 'Beauty & Cosmetology',
      outcomes: ['Indiana Barber License', 'DOL Apprenticeship Certificate'],
    }} />
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/barber-hero-final.mp4" />
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Barber Apprenticeship' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/barber-hero-new.jpg" alt="Barber Apprenticeship Program" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Earn While You Learn</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Barber Apprenticeship</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Get paid during your apprenticeship. Become a licensed barber in 18 months with hands-on training.
            </p>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <section className="py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <PageAvatar videoSrc="/videos/avatars/barber-guide.mp4" title="Barber Apprenticeship Guide" />
        </div>
      </section>

      <section className="bg-slate-900 py-5">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { val: '18 Months', label: 'Apprenticeship' },
            { val: 'State License', label: 'Barber License' },
            { val: '$30K-$60K+', label: 'Earning Potential' },
            { val: 'Paid', label: 'During Training' },
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
              <Image src="/images/hero/hero-barber.jpg" alt="Barber training" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">What You&apos;ll Learn</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">Hands-on training in a real barbershop environment under a licensed instructor.</p>
              <div className="space-y-2">
                {['Haircutting techniques (fades, tapers, lineups)', 'Clipper and shear mastery', 'Shaving and beard grooming', 'Sanitation and safety (Indiana State Board)', 'Client consultation and customer service', 'Business management and booth rental basics', 'Indiana barber license exam preparation'].map((item) => (
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

      {/* Partner Shop Program */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-3">Become a Partner Shop</h2>
          <p className="text-base text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Licensed barbershops in Indiana can host apprentices through our USDOL-registered program. 
            We handle compliance, classroom training, and documentation — you provide hands-on supervision.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-3">Shop Requirements</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Your barbershop must hold an active Indiana license in good standing. The supervising barber needs an active license with at least two years of experience. 
                You will need workers&apos; compensation insurance and a physical shop location in Indiana. 
                Both parties sign a Memorandum of Understanding (MOU) before the apprenticeship begins.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-3">What We Provide</h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Elevate handles all USDOL and RAPIDS registration and compliance paperwork. We coordinate the required classroom instruction hours, 
                maintain official apprenticeship records, conduct ongoing support visits to your shop, and issue completion certificates when the apprentice finishes the program.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/partners/barbershop-apprenticeship"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-lg font-bold px-8 py-4 rounded-lg transition-colors"
            >
              Learn More & Apply
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How It Works</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Complete Intake', desc: 'Submit the funding and eligibility intake form online. You will answer questions about your background, work history, and funding eligibility (WIOA, JRI, or self-pay). No documents are needed at this stage — just your basic information.' },
              { step: '2', title: 'Get Matched', desc: 'Once approved, our team pairs you with a licensed barber instructor at a partner barbershop near you. You will meet your instructor, tour the shop, and agree on a training schedule that works for both of you.' },
              { step: '3', title: 'Earn While You Learn', desc: 'You complete 1,500 on-the-job training hours at the shop plus required classroom instruction. Apprentices are paid during training. The full program takes approximately 18 months depending on your schedule.' },
              { step: '4', title: 'Get Licensed', desc: 'After completing all required hours and coursework, you sit for the Indiana State Board barber exam. We provide exam prep materials and practice tests. Once you pass, you receive your Indiana barber license and can work independently or open your own shop.' },
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

          {/* Eligibility & Funding Info */}
          <div className="mt-10 bg-slate-50 rounded-xl p-6">
            <h3 className="font-bold text-slate-900 text-lg mb-3">Eligibility and Funding</h3>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              You must be at least 16 years old and have a valid government-issued ID. No prior barbering experience is required. 
              A high school diploma or GED is preferred but not mandatory for all funding sources.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              <strong>JRI (Justice Reinvestment Initiative):</strong> If you are justice-involved (currently on probation, parole, or recently released), 
              JRI funding may cover your entire apprenticeship at no cost. JRI also provides supportive services like transportation assistance and work supplies.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              <strong>WIOA:</strong> Adults and dislocated workers who meet income guidelines or are receiving public assistance may qualify for WIOA funding, 
              which covers tuition, books, supplies, and in some cases transportation and childcare.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Self-Pay:</strong> If you do not qualify for funding, the program cost is available on request. Payment plans are available. 
              Contact us or submit the intake form to find out which funding you qualify for — there is no obligation.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-brand-red-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Barber Career</h2>
          <p className="text-white mb-6 text-sm">Earn while you learn. JRI funding available for qualifying students.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply/intake?program=barbering" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-red-50 transition-colors text-center">
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link href="/funding" className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center">
              Explore Funding Options
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
