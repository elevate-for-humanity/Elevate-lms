/**
 * HeroMediaFrame — standard container for hero media (video or image).
 *
 * Provides consistent aspect ratio, overflow clipping, and border treatment.
 * Use this to wrap CanonicalVideo or a Next.js Image in a CanonicalHero.
 *
 * Usage:
 *   <HeroMediaFrame>
 *     <CanonicalVideo src="..." poster="..." className="absolute inset-0 w-full h-full object-cover" />
 *   </HeroMediaFrame>
 */

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Height class — defaults to a responsive 45–60vh range */
  heightClass?: string;
  className?: string;
};

export default function HeroMediaFrame({
  children,
  heightClass = 'h-[45vh] sm:h-[50vh] md:h-[55vh] min-h-[280px] max-h-[640px]',
  className = '',
}: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-900 ${heightClass} ${className}`}
    >
      {children}
    </div>
  );
}
