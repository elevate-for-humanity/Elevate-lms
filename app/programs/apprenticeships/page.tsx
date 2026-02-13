import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Apprenticeship Programs | Earn While You Learn | Elevate',
  description: 'Apprenticeship programs in Indianapolis. Barber, cosmetology, culinary, and nail technician. Earn while you learn — get paid during training.',
  alternates: { canonical: `${SITE_URL}/programs/apprenticeships` },
};

export default function ApprenticeshipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships' }]} />
        </div>
      </div>

      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image src="/images/hero/hero-hands-on-training.jpg" alt="Apprenticeship Programs" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">Earn While You Learn</span>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Apprenticeship Programs</h1>
            <p className="text-sm sm:text-lg text-white/90 max-w-xl">
              Get paid during your training. US Department of Labor registered apprenticeships with JRI funding available.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">Choose Your Apprenticeship</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', img: '/images/barber-hero-new.jpg', duration: '18 months' },
              { name: 'Cosmetology Apprenticeship', href: '/programs/cosmetology-apprenticeship', img: '/images/efh/programs/beauty.jpg', duration: '18 months' },
              { name: 'Culinary Apprenticeship', href: '/programs/culinary-apprenticeship', img: '/images/culinary/hero-program-culinary.jpg', duration: '6-12 months' },
              { name: 'Nail Technician', href: '/programs/nail-technician-apprenticeship', img: '/images/pathways/beauty-hero.jpg', duration: '6-9 months' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group">
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden mb-2">
                  <Image src={p.img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-slate-500 text-xs">{p.duration} — Paid during training</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6">How to Enroll</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Apply Online', desc: 'Submit your apprenticeship application.' },
              { step: '2', title: 'Check Funding', desc: 'Register at indianacareerconnect.com for JRI eligibility.' },
              { step: '3', title: 'Get Matched', desc: 'Paired with a licensed instructor at a real workplace.' },
              { step: '4', title: 'Earn While You Learn', desc: 'Get paid while completing your training hours and get licensed.' },
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Start Your Apprenticeship</h2>
          <p className="text-white/90 mb-6 text-sm">Get paid while you train. Apply today.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply?program=apprenticeship" className="bg-white text-brand-red-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-red-50 transition-colors text-center">
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
