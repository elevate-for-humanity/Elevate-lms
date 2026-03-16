import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  image: string;
  alt: string;
  title: string;
  description: string;
  href?: string;
  /** 'feature' = 16:10 (platform screenshots), 'program' = 4:3 (training photos) */
  ratio?: 'feature' | 'program';
}

/**
 * Standard marketing card with a required image as the primary visual.
 * Icons are not used as primary visuals — use small utility icons in description text only.
 */
export function FeatureCard({ image, alt, title, description, href, ratio = 'feature' }: FeatureCardProps) {
  const aspectStyle = ratio === 'program'
    ? { aspectRatio: '4/3' }
    : { aspectRatio: '16/10' };

  const inner = (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition h-full flex flex-col">
      <div className="relative w-full overflow-hidden" style={aspectStyle}>
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed flex-1">{description}</p>
        {href && (
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold">
              Learn more <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{inner}</Link>;
  }
  return inner;
}
