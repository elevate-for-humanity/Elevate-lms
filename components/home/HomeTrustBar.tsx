/**
 * HomeTrustBar
 *
 * Institutional validation strip. Organization-level approvals are worded so
 * they do not imply that every individual program is funded or separately approved.
 */

import Image from 'next/image';
import Link from 'next/link';

const TRUST_ITEMS = [
  {
    img: '/images/pages/about-career-pathways.webp',
    label: 'DOL Registered Sponsor',
    sub: 'Federal apprenticeship sponsor registration',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/pages/wioa-meeting.webp',
    label: 'Indiana ETPL Provider',
    sub: 'Verified listed programs may qualify for WIOA funding',
    href: '/federal-compliance',
  },
  {
    img: '/images/pages/about-career-training.webp',
    label: 'Workforce Funding Ready',
    sub: 'Eligibility and covered costs vary by program and participant',
    href: '/eligibility',
  },
  {
    img: '/images/pages/comp-state-career-hero.webp',
    label: 'RAPIDS Tracked',
    sub: 'Registered apprenticeship records and sponsor oversight',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/pages/about-team-hero.webp',
    label: 'Indiana Workforce Network',
    sub: 'Works with WorkOne and workforce partners',
    href: '/partners/workforce',
  },
  {
    img: '/images/pages/funding-impact-2.jpg',
    label: 'JRI Partner',
    sub: 'Eligible services and participants are reviewed separately',
    href: '/partners/jri',
  },
];

const PARTNER_LOGOS = [
  {
    src: '/images/pages/about-funding-nav.webp',
    alt: 'US Department of Labor',
    href: '/federal-compliance',
  },
  {
    src: '/images/pages/about-partner-cta.webp',
    alt: 'Indiana Department of Workforce Development',
    href: '/partners/workforce',
  },
  {
    src: '/images/pages/workforce-board-page-2.webp',
    alt: 'WorkOne Indiana',
    href: '/partners/workforce',
  },
  { src: '/images/pages/federal-funded.webp', alt: 'Next Level Jobs', href: '/eligibility' },
  { src: '/images/pages/about-hero.webp', alt: 'OSHA training alignment', href: '/compliance' },
];

export function HomeTrustBar() {
  return (
    <section
      className="bg-slate-50 border-t border-slate-200"
      aria-label="Institutional credentials and partnerships"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="mx-auto mb-7 max-w-4xl rounded-2xl border border-slate-300 bg-slate-950 px-5 py-5 text-center text-white shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-300">Verified institutional status</p>
          <p className="mt-2 text-base font-black sm:text-lg">
            Elevate for Humanity operates as a U.S. Department of Labor Registered Apprenticeship sponsor and an Indiana ETPL-listed training provider.
          </p>
          <p className="mt-2 text-xs font-medium leading-5 text-slate-300">
            Program funding, participant eligibility, licensing requirements, and covered costs are verified at the individual program level before enrollment.
          </p>
        </div>

        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600">
          Institutional credentials &amp; workforce alignment
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {TRUST_ITEMS.map(({ img, label, sub, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-5 text-center shadow-sm transition-all hover:border-brand-blue-200 hover:shadow-md"
            >
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-2">
                <Image
                  src={img}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                  sizes="64px"
                />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight text-slate-900 group-hover:text-brand-blue-700">
                  {label}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-slate-600">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600">
            Workforce and compliance ecosystem
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {PARTNER_LOGOS.map((logo) => (
              <Link
                key={logo.src}
                href={logo.href}
                aria-label={logo.alt}
                className="relative h-12 w-28 opacity-80 transition-opacity duration-300 hover:opacity-100 md:h-14 md:w-32"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain"
                  sizes="128px"
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
