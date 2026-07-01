/**
 * HomeTrustBar
 *
 * Institutional validation strip — DOL registration, WIOA/ETPL approval,
 * RAPIDS tracking, JRI funding, WorkOne alignment. Each badge links to
 * the relevant proof/detail page. Rendered near the bottom of the homepage.
 */

import Image from 'next/image';
import Link from 'next/link';

const TRUST_ITEMS = [
  {
    img: '/images/partners/usdol.webp',
    label: 'DOL Registered',
    sub: 'Federal apprenticeship sponsor',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/partners/dwd.webp',
    label: 'ETPL Approved',
    sub: 'WIOA-funded tuition eligible',
    href: '/federal-compliance',
  },
  {
    img: '/images/hp/wioa.webp',
    label: 'WIOA Aligned',
    sub: 'Title I & II compliant',
    href: '/eligibility',
  },
  {
    img: '/images/partners/nextleveljobs.webp',
    label: 'RAPIDS Tracked',
    sub: 'DOL apprenticeship system',
    href: '/compliance/apprenticeship-structure',
  },
  {
    img: '/images/partners/workone.webp',
    label: 'WorkOne Partner',
    sub: 'Indiana DWD aligned',
    href: '/partners/workforce',
  },
  {
    img: '/images/pages/jri-hero.webp',
    label: 'JRI Approved',
    sub: 'Marion County free tuition',
    href: '/partners/jri',
  },
];

const PARTNER_LOGOS = [
  { src: '/images/partners/usdol.webp', alt: 'US Department of Labor', href: '/federal-compliance' },
  { src: '/images/partners/dwd.webp', alt: 'Indiana Department of Workforce Development', href: '/partners/workforce' },
  { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana', href: '/partners/workforce' },
  { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs', href: '/eligibility' },
  { src: '/images/partners/osha.webp', alt: 'OSHA Authorized', href: '/compliance' },
];

export function HomeTrustBar() {
  return (
    <section
      className="bg-slate-50 border-t border-slate-200"
      aria-label="Institutional credentials and partnerships"
    >
      {/* Credential badges — 2 cols mobile, 3 cols sm, 6 cols lg */}
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-12">
        <p className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-6">
          Accreditations &amp; Approvals
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRUST_ITEMS.map(({ img, label, sub, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-3 px-3 py-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-brand-blue-200 hover:shadow-md transition-all text-center group"
            >
              <div className="relative w-16 h-16 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-2">
                <Image
                  src={img}
                  alt=""
                  width={56}
                  height={56}
                  className="object-contain w-full h-full"
                  sizes="64px"
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

      {/* Partner logos */}
      <div className="border-t border-slate-200 bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-6">
            Aligned with workforce development partners
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
