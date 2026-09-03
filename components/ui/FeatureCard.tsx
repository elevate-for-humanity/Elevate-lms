import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { card, type as typeTokens } from '@/lib/page-design-tokens';

interface FeatureCardProps {
  image: string;
  alt: string;
  title: string;
  description: string;
  href?: string;
  /** 'feature' = 16:9, 'program' = 4:3 */
  ratio?: 'feature' | 'program';
}

export function FeatureCard({
  image,
  alt,
  title,
  description,
  href,
  ratio = 'feature',
}: FeatureCardProps) {
  const mediaClass = ratio === 'program' ? card.image4x3 : card.image16x9;

  const inner = (
    <article className={`${card.base} group flex h-full flex-col motion-reduce:transform-none motion-reduce:transition-none`}>
      <div className={mediaClass}>
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </div>
      <div className={`${card.body} flex flex-1 flex-col`}>
        <h3 className={`${typeTokens.h3} mb-2`}>{title}</h3>
        <p className={`${typeTokens.bodySmall} flex-1`}>{description}</p>
        {href ? (
          <div className="mt-5">
            <span className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-red-700">
              Learn more <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );

  if (!href) return inner;

  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
    >
      {inner}
    </Link>
  );
}
