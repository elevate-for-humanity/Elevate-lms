/**
 * HomeWhyChoose — institutional proof strip (above the fold, after marquee).
 * Answers "why trust Elevate?" for workforce reviewers and prospective learners.
 */

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const PROOF_ITEMS = [
  { label: 'DOL Registered Apprenticeship Sponsor', href: '/compliance/apprenticeship-structure' },
  { label: 'Indiana ETPL Provider', href: '/federal-compliance' },
  { label: 'Certiport Authorized Testing Center', href: '/programs/technology' },
  { label: 'ACT WorkKeys Assessment Partner', href: '/testing' },
  { label: 'HSI Authorized Training', href: '/programs/healthcare' },
];

const PARTNER_LOGOS = [
  { src: '/images/heroes/hero-homepage.webp', alt: 'US Department of Labor', href: '/federal-compliance' },
  { src: '/images/heroes/hero-homepage.webp', alt: 'Indiana DWD', href: '/workforce-partners' },
  { src: '/images/heroes/hero-homepage.webp', alt: 'WorkOne Indiana', href: '/workforce-partners' },
  { src: '/images/heroes/hero-homepage.webp', alt: 'Next Level Jobs', href: '/eligibility' },
  { src: '/images/heroes/hero-homepage.webp', alt: 'OSHA Authorized', href: '/compliance' },
  { src: '/images/partners/microsoft-logo.png', alt: 'Microsoft training partner', href: '/programs/technology' },
  { src: '/images/partners/certiport.svg', alt: 'Certiport authorized testing', href: '/programs/technology' },
  { src: '/images/partners/act-workkeys.svg', alt: 'ACT WorkKeys assessment partner', href: '/testing' },
  { src: '/images/partners/hsi.svg', alt: 'HSI authorized training', href: '/programs/healthcare' },
];

export function HomeWhyChoose() {
  return (
    <section className="bg-white border-b border-slate-200 py-8 px-4" aria-labelledby="why-choose-heading">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
          <div>
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Why Choose Elevate</p>
            <h2 id="why-choose-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900">Credentialed. Funded. Workforce-aligned.</h2>
          </div>
          <Link href="/about" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-700 hover:text-brand-blue-900 shrink-0">
            Our credentials &amp; compliance <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <ul className="flex flex-wrap gap-2 mb-8">
          {PROOF_ITEMS.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="inline-block text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-brand-blue-50 hover:text-brand-blue-800 border border-slate-200 rounded-full px-3 py-1.5 transition-colors">{item.label}</Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 opacity-90">
          {PARTNER_LOGOS.map((logo) => (
            <Link key={`${logo.src}-${logo.alt}`} href={logo.href} aria-label={logo.alt} className="relative h-10 w-24 md:h-12 md:w-28 hover:opacity-100 opacity-80 transition-opacity">
              <Image src={logo.src} alt={logo.alt} fill className="object-contain" sizes="112px" loading="lazy" placeholder="empty" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
