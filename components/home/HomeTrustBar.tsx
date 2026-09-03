/**
 * HomeTrustBar
 *
 * Institutional verification strip. This surface deliberately distinguishes
 * registrations, provider approvals, funding pathways, and partner alignment
 * instead of presenting every relationship as an accreditation.
 */

import Image from 'next/image';
import Link from 'next/link';

const TRUST_ITEMS = [
  {
    img: '/images/pages/about-career-pathways.webp',
    alt: 'Registered apprenticeship career pathway at Elevate for Humanity',
    label: 'DOL Registered',
    sub: 'Registered Apprenticeship sponsor',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/pages/wioa-meeting.webp',
    alt: 'Indiana workforce training and ETPL program coordination',
    label: 'ETPL Listed',
    sub: 'Approved programs are listed by the state',
    href: '/approvals',
  },
  {
    img: '/images/pages/about-career-training.webp',
    alt: 'WIOA career training pathway at Elevate for Humanity',
    label: 'WIOA Pathways',
    sub: 'Eligibility and authorization are program-specific',
    href: '/eligibility',
  },
  {
    img: '/images/pages/comp-state-career-hero.webp',
    alt: 'Registered apprenticeship RAPIDS reporting and compliance workflow',
    label: 'RAPIDS Tracked',
    sub: 'Registered apprenticeship reporting workflow',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/pages/about-team-hero.webp',
    alt: 'WorkOne workforce referral and training coordination in Indiana',
    label: 'WorkOne Coordination',
    sub: 'Workforce referral and funding coordination',
    href: '/for-agencies',
  },
  {
    img: '/images/pages/funding-impact-2.jpg',
    alt: 'Job Ready Indy workforce training pathway and participant support',
    label: 'JRI Pathway',
    sub: 'Availability depends on current authorization',
    href: '/partners/jri',
  },
];

const PARTNER_LOGOS = [
  {
    src: '/images/pages/about-funding-nav.webp',
    alt: 'US Department of Labor workforce system',
    href: '/federal-compliance',
  },
  {
    src: '/images/pages/about-partner-cta.webp',
    alt: 'Indiana Department of Workforce Development',
    href: '/for-agencies',
  },
  {
    src: '/images/pages/workforce-board-page-2.webp',
    alt: 'WorkOne Indiana workforce system',
    href: '/for-agencies',
  },
  { src: '/images/pages/federal-funded.webp', alt: 'Next Level Jobs funding pathway', href: '/eligibility' },
  { src: '/images/pages/about-hero.webp', alt: 'Workplace safety training', href: '/compliance' },
];

export function HomeTrustBar() {
  return (
    <section
      className="bg-slate-50 border-t border-slate-200"
      aria-label="Institutional registrations, approvals, funding pathways, and workforce alignment"
    >
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
        <p className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-6">
          Registrations, approvals &amp; funding pathways
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRUST_ITEMS.map(({ img, alt, label, sub, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-3 px-3 py-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-blue-200 hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-16 h-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-2">
                <Image
                  src={img}
                  alt={alt}
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                  sizes="(max-width: 640px) 40vw, 16vw"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-brand-blue-700">
                  {label}
                </p>
                <p className="text-[10px] text-slate-600 leading-snug mt-1">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-6">
            Workforce systems and public-sector alignment
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {PARTNER_LOGOS.map((logo) => (
              <Link
                key={logo.src}
                href={logo.href}
                aria-label={logo.alt}
                className="relative h-12 w-28 md:h-14 md:w-32 opacity-80 hover:opacity-100 transition-opacity duration-300"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 40vw, 10vw"
                  loading="lazy"
                  placeholder="empty"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
