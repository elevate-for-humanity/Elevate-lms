import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeships' },
  title: 'Apprenticeships',
  description:
    'Earn while you learn through DOL-registered apprenticeship pathways in barbering, cosmetology, skilled trades, and more.',
};

const tracks = [
  { title: 'Barbering', href: '/programs/barber-apprenticeship', desc: 'DOL-registered apprenticeship. Earn while you complete your hours toward licensure.', img: '/images/pages/barber-apprenticeship-hero.jpg' },
  { title: 'Cosmetology', href: '/programs/cosmetology-apprenticeship', desc: 'Complete your cosmetology hours through a structured earn-while-you-learn program.', img: '/images/pages/cosmetology-apprenticeship-hero.webp' },
  { title: 'Culinary Arts', href: '/programs/culinary-apprenticeship', desc: 'Hands-on culinary training with employer partners in the food service industry.', img: '/images/pages/culinary-apprenticeship-hero.webp' },
  { title: 'Skilled Trades', href: '/programs/skilled-trades', desc: 'Apprenticeship pathways in electrical, plumbing, and construction trades.', img: '/images/pages/skilled-trades-hero.webp' },
];

const employerBenefits = [
  'Build a trained, job-ready workforce pipeline',
  'Access OJT wage reimbursement through WIOA',
  'Reduce turnover with earn-while-you-learn talent',
  'Structured apprenticeship framework with compliance support',
];

export default function ApprenticeshipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'Apprenticeships' }]} /></div></div>

      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">DOL Registered Apprenticeships</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">Earn While You Learn</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">Registered apprenticeship pathways connecting individuals to structured, paid training in barbering, cosmetology, skilled trades, and other licensed professions.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">Apply for Apprenticeship</Link>
            <Link href="/for-employers" className="border-2 border-white/40 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">Host an Apprentice</Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Available Tracks</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Apprenticeship Pathways</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {tracks.map((t) => (
              <Link key={t.title} href={t.href} className="group rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-red-300 hover:shadow-md transition-all flex flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image src={t.img} alt={t.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 50vw" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 text-base mb-2">{t.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-3">{t.desc}</p>
                  <span className="text-brand-red-600 text-sm font-bold group-hover:underline">View Program <ArrowRight className="inline w-4 h-4 ml-1" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">For Employers</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Host an Apprentice. Build Your Workforce.</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">Employers can host apprentices and build workforce pipelines through Elevate&apos;s DOL-registered apprenticeship program. We handle compliance, reporting, and coordination — you get trained, job-ready talent.</p>
            <ul className="space-y-3 mb-8">
              {employerBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />{b}
                </li>
              ))}
            </ul>
            <Link href="/for-employers" className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm">Partner With Us →</Link>
          </div>
          <div className="relative w-full lg:w-96 h-64 rounded-2xl overflow-hidden shrink-0">
            <Image src="/images/pages/about-employer-partners.webp" alt="Employer apprenticeship partnership" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 384px" />
          </div>
        </div>
      </section>

      <section className="bg-brand-red-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Start Your Apprenticeship?</h2>
          <p className="text-red-100 text-sm mb-8">Apply once. Get connected to training, funding, and employer placement.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="bg-white text-brand-red-700 font-bold px-8 py-3.5 rounded-lg hover:bg-red-50 transition-colors text-sm text-center">Apply Now</Link>
            <Link href="/check-eligibility" className="border-2 border-white/60 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm text-center">Check Eligibility</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
