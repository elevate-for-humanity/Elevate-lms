'use client';

/**
 * HeroPicture — picture-based hero banner.
 *
 * Same non-negotiable rules as HeroVideo:
 * - No gradient overlays on the image frame.
 * - No headline, subheadline, paragraph, or CTA on top of the image.
 * - Only allowed on-image elements: micro-label (2–4 words max), brand bug.
 * - All primary messaging renders in the below-hero content slot.
 */

import Image from 'next/image';
import { useId, useState } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface HeroPictureCta {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}

export interface HeroPictureProps {
  src: string;
  alt: string;
  microLabel?: string;
  showBrandBug?: boolean;
  belowHeroHeadline?: string;
  belowHeroSubheadline?: string;
  ctas?: HeroPictureCta[];
  trustIndicators?: string[];
  transcript?: string;
  analyticsName?: string;
  className?: string;
  children?: React.ReactNode;
  /** Canonical site-wide hero height. Override only for a documented layout need. */
  heightStyle?: string;
  /** Render the …5872 tokens truncated…="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-slate-800"
              >
                {transcript}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
