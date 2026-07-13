/**
 * HeroMediaFrame — standard container for hero media (video or image).
 *
 * Provides consistent aspect ratio, overflow clipping, and border treatment.
 * Use this to wrap CanonicalVideo or a Next.js Image in a CanonicalHero.
 *
 * Usage:
 *   <HeroMediaFrame>
 *     <UltraVideoPlayer src="..." poster="..." className="absolute inset-0 w-full h-full object-cover" />
 *   </HeroMediaFrame>
 */

import type { ReactNode } from 'react';
import { hero as heroTokens } from '@/lib/page-design-tokens';

type Props = {
  children: ReactNode;
  /** Height class — defaults to locked marketing hero tokens */
  heightClass?: string;
  className?: string;
};

export default function HeroMediaFrame({
  children,
  heightClass = heroTokens.imageWrap,
  className = '',
}: Props) {
  return (
    <div className={`relative w-full overflow-hidden bg-slate-900 ${heightClass} ${className}`}>
      {children}
    </div>
  );
}
