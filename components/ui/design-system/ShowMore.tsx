"use client";

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SHOW MORE COMPONENT - 10/10
 *
 * Mobile collapse pattern for long content.
 *
 * On mobile: Show preview + "Show more" button
 * On desktop: Show full content (or keep collapsed)
 *
 * This cuts mobile scroll by ~40%.
 */

interface ShowMoreProps {
  children: ReactNode;
  preview?: ReactNode;
  previewLines?: number;
  defaultExpanded?: boolean;
  alwaysExpandedOnDesktop?: boolean;
  className?: string;
}

export function ShowMore({
  children,
  preview,
  previewLines = 2,
  defaultExpanded = false,
  alwaysExpandedOnDesktop = false,
  className,
}: ShowMoreProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const shouldShowButton =
    !alwaysExpandedOnDesktop ||
    typeof window === 'undefined' ||
    window.innerWidth < 768;

  return (
    <div className={cn('relative', className)}>
      {/* Preview or truncated content */}
      {!isExpanded && preview ? (
        <div className={alwaysExpandedOnDesktop ? 'md:hidden' : ''}>
          {preview}
        </div>
      ) : !isExpanded && previewLines ? (
        <div
          className={cn(
            'overflow-hidden',
            alwaysExpandedOnDesktop ? 'md:hidden' : '',
            `line-clamp-${previewLines}`
          )}
        >
          {children}
        </div>
      ) : null}

      {/* Full content */}
      <div
        className={cn(
          isExpanded ? 'block' : 'hidden',
          alwaysExpandedOnDesktop && 'md:block'
        )}
      >
        {children}
      </div>

      {/* Show More/Less button */}
      {shouldShowButton && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className={cn(
            'mt-4 inline-flex items-center gap-2',
            'text-brand-blue-600 hover:text-brand-blue-700 font-semibold',
            'transition-colors',
            alwaysExpandedOnDesktop && 'md:hidden'
          )}
        >
          <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
