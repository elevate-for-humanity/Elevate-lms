import Image from 'next/image';
import Link from 'next/link';
import { btn, layout, type as typeTokens } from '@/lib/page-design-tokens';

const PHOTO_SIZES = '(max-width: 640px) 48vw, (max-width: 1024px) 46vw, 28vw';

const photos = [
  { src: '/images/pages/comp-photo-cta-1.webp', alt: 'Barber apprenticeship in action' },
  { src: '/images/programs/cna-hero.webp', alt: 'Healthcare student in lab coat' },
  { src: '/images/pages/comp-photo-cta-2.webp', alt: 'HVAC technician training' },
  { src: '/images/pages/comp-photo-cta-3.webp', alt: 'Classroom and coaching' },
] as const;

export function PhotoCTA() {
  return (
    <section className="bg-white">
      <div className={`${layout.container} ${layout.section}`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14">
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Training environments">
            {photos.map((photo) => (
              <div
                key={photo.src}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.02] motion-reduce:transition-none"
                  sizes={PHOTO_SIZES}
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div>
            <p className={typeTokens.eyebrow}>Real spaces, real people</p>
            <h2 className={`${typeTokens.h2} mt-3`}>
              See the environments where training becomes work.
            </h2>
            <p className={`${typeTokens.bodySmall} mt-4`}>
              From barber shops and healthcare settings to skilled-trades training and classroom
              coaching, the experience should feel connected to the work learners are preparing to do.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/apply" className={btn.primary}>
                Start an application
              </Link>
              <Link href="/for-employers" className={btn.secondary}>
                Employers and partners
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
