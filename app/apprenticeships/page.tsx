import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight } from 'lucide-react';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { ApprenticeshipInfraSection } from '@/components/apprenticeships/ApprenticeshipInfraSection';
import { ApprenticeshipPageSubnav } from '@/components/apprenticeships/ApprenticeshipPageSubnav';
import { btn, card, layout, type } from '@/lib/page-design-tokens';

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeships' },
  title: 'Apprenticeships',
  description:
    'Earn while you learn through DOL-registered apprenticeship pathways in barbering, cosmetology, skilled trades, and more.',
};

const tracks = [
  {
    title: 'Barbering',
    href: '/programs/barber-apprenticeship',
    desc: 'DOL-registered apprenticeship. Earn while you complete your hours toward licensure.',
    img: '/images/pages/barber-apprenticeship-hero.jpg',
  },
  {
    title: 'Cosmetology',
    href: '/programs/cosmetology-apprenticeship',
    desc: 'Complete your cosmetology hours through a structured earn-while-you-learn program.',
    img: '/images/pages/cosmetology-apprenticeship-hero.webp',
  },
  {
    title: 'Culinary Arts',
    href: '/programs/culinary-apprenticeship',
    desc: 'Hands-on culinary training with employer partners in the food service industry.',
    img: '/images/pages/culinary-apprenticeship-hero.webp',
  },
  {
    title: 'Skilled Trades',
    href: '/programs/skilled-trades',
    desc: 'Apprenticeship pathways in electrical, plumbing, and construction trades.',
    img: '/images/pages/skilled-trades-hero.webp',
  },
];

const banner = heroBanners.apprenticeships;

export default function ApprenticeshipsPage() {
  const ctas = [banner.primaryCta, banner.secondaryCta].filter(Boolean);

  return (
    <div className="min-h-screen bg-white pt-[60px]">
      <div className="bg-white border-b">
        <div className={`${layout.container} py-3`}>
          <Breadcrumbs items={[{ label: 'Apprenticeships' }]} />
        </div>
      </div>

      <div id="overview">
        <HeroVideo
          videoSrcDesktop={banner.videoSrcDesktop!}
          videoSrcMobile={banner.videoSrcMobile}
          voiceoverSrc={banner.voiceoverSrc}
          microLabel={banner.microLabel}
          belowHeroHeadline={banner.belowHeroHeadline}
          belowHeroSubheadline={banner.belowHeroSubheadline}
          ctas={ctas}
          trustIndicators={banner.trustIndicators}
          transcript={banner.transcript}
          analyticsName={banner.analyticsName}
        />
      </div>

      <ApprenticeshipPageSubnav />

      <section id="pathways" className={`${layout.section} scroll-mt-28`}>
        <div className={layout.containerMedium}>
          <p className={`${type.eyebrow} text-center`}>Available tracks</p>
          <h2 className={`${type.h2} text-center mt-2 mb-8`}>Apprenticeship pathways</h2>
          <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
            {tracks.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className={`${card.base} group flex flex-col`}
              >
                <div className={card.programImage}>
// IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback)
                  <Image
                    src={t.img}
                    alt={t.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className={`${card.body} flex-1 flex flex-col`}>
                  <h3 className={type.h3}>{t.title}</h3>
                  <p className={`${type.bodySmall} flex-1 mt-2 mb-3`}>{t.desc}</p>
                  <span className="text-brand-red-600 text-sm font-bold group-hover:underline">
                    View program <ArrowRight className="inline w-4 h-4 ml-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <p className={`${type.bodySmall} text-center mt-8`}>
            Also see{' '}
            <Link
              href="/programs/esthetician-apprenticeship"
              className="font-semibold text-brand-red-600 hover:underline"
            >
              esthetics
            </Link>
            ,{' '}
            <Link
              href="/programs/nail-technician-apprenticeship"
              className="font-semibold text-brand-red-600 hover:underline"
            >
              nail technology
            </Link>
            , and host-shop listings in the <strong className="font-semibold text-slate-800">Apprenticeships</strong>{' '}
            menu in the site header.
          </p>
        </div>
      </section>

      <ApprenticeshipInfraSection showSectionIntro={false} />

      <section className="bg-slate-900 py-12 sm:py-14 px-4">
        <div className={`${layout.containerNarrow} text-center`}>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            Ready to start your apprenticeship?
          </h2>
          <p className="text-slate-300 text-sm mb-6">
            Apply once. Get connected to training, funding, and employer placement.
          </p>
          <div className={`${btn.row} justify-center`}>
            <Link href="/apply" className={btn.primary}>
              Apply now
            </Link>
            <Link
              href="/check-eligibility"
              className="border-2 border-white/50 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm sm:text-base text-center"
            >
              Check eligibility
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
