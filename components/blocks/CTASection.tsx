'use client';

/**
 * CTASection — hard visual stop at the bottom of a program page.
 * Solid dark background. Two CTAs max. No gradients.
 */

import Link from 'next/link';

interface CTA {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

interface Props {
  heading: string;
  subheading?: string;
  ctas: [CTA, ...CTA[]];
  /** Default: dark */
  bg?: 'dark' | 'red' | 'white';
}

export default function CTASection({ heading, subheading, ctas, bg = 'dark' }: Props) {
  const sectionBg =
    bg === 'red'   ? 'bg-brand-red-600 border-t border-brand-red-700' :
    bg === 'white' ? 'bg-white border-t-4 border-slate-900' :
                     'bg-slate-900 border-t border-slate-800';
  const headingColor = bg === 'white' ? 'text-slate-900' : 'text-white';
  const subColor     = bg === 'white' ? 'text-slate-600' : 'text-slate-300';

  return (
    <section className={`${sectionBg} py-16 sm:py-20 px-4`}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${headingColor} mb-3 leading-tight`}>{heading}</h2>
        {subheading && <p className={`${subColor} text-base mb-8 max-w-xl mx-auto`}>{subheading}</p>}
        <div className="flex flex-wrap gap-4 justify-center">
          {ctas.map((cta, i) => {
            const isPrimary = cta.variant !== 'secondary';
            const btnClass = isPrimary
              ? bg === 'white'
                ? 'bg-slate-900 hover:bg-slate-700 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-900'
              : bg === 'white'
                ? 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50'
                : 'border-2 border-white/30 text-white hover:bg-white/10';
            return (
              <Link
                key={i}
                href={cta.href}
                className={`${btnClass} font-bold px-8 py-3.5 rounded-lg transition-colors text-sm sm:text-base`}
              >
                {cta.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
