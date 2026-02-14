'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface StickyMobileCTAProps {
  primaryText?: string;
  primaryHref?: string;
  secondaryText?: string;
  secondaryHref?: string;
}

export function StickyMobileCTA({
  primaryText = 'Apply Now',
  primaryHref = '/apply',
  secondaryText = 'Talk to Advisor',
  secondaryHref = '/contact',
}: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 z-40 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="p-4 flex gap-2">
        <a
          href={primaryHref}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
        >
          {primaryText}
          <ArrowRight className="w-4 h-4" />
        </a>
        <a
          href={secondaryHref}
          className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-white text-brand-blue-600 border-2 border-brand-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          {secondaryText}
        </a>
      </div>
    </div>
  );
}
