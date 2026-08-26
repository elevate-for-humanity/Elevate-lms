'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Phone, FileText, X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface StickyMobileCTAProps {
  phoneNumber?: string;
  textNumber?: string;
  applyUrl?: string;
  hideOnPaths?: string[];
}

export function StickyMobileCTA({
  phoneNumber = '(317) 314-3757',
  textNumber = '3143757',
  applyUrl = '/apply',
  hideOnPaths = ['/apply', '/checkout', '/admin', '/portals'],
}: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // Check if we should hide based on current path
    const shouldHide = hideOnPaths.some((path) => window.location.pathname.startsWith(path));
    if (shouldHide) {
      setIsHidden(true);
      return;
    }

    // Show after scrolling past hero (approximately 500px)
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show sticky CTA after scrolling 500px
      if (currentScrollY > 500) {
        setHasScrolled(true);
        setIsVisible(true);
      } else {
        setHasScrolled(false);
        setIsVisible(false);
      }

      // Hide when scrolling down fast, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 1000) {
        setIsVisible(false);
      } else if (hasScrolled) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hideOnPaths, hasScrolled, lastScrollY]);

  if (isHidden) return null;

  return (
    <>
      {/* Expandable Action Panel */}
      {isExpanded && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">How can we help?</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Text Admissions */}
              <a
                href={`sms:${textNumber}?body=Hi! I'm interested in Elevate training programs. Can you help me?`}
                className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Text Us</p>
                  <p className="text-sm text-gray-600">Get answers instantly</p>
                </div>
              </a>

              {/* Call Now */}
              <a
                href={`tel:${phoneNumber.replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Call Us</p>
                  <p className="text-sm text-gray-600">{phoneNumber}</p>
                </div>
              </a>

              {/* Apply Now */}
              <Link
                href={applyUrl}
                className="flex items-center gap-4 p-4 bg-brand-blue-600 rounded-xl hover:bg-brand-blue-700 transition-colors text-white"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Apply Now</p>
                  <p className="text-sm text-blue-100">Start your journey</p>
                </div>
              </Link>

              {/* Check Eligibility */}
              <Link
                href="/check-eligibility"
                className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Check Eligibility</p>
                  <p className="text-sm text-gray-600">See if you qualify for funding</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Bar */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]
          transition-transform duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
          md:hidden
        `}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Text Button */}
          <a
            href={`sms:${textNumber}?body=Hi! I'm interested in Elevate training programs.`}
            className="flex flex-col items-center gap-1 p-2 text-green-600 hover:text-green-700"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs font-medium">Text</span>
          </a>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? <X className="w-6 h-6" /> : <ChevronUp className="w-6 h-6" />}
            <span className="text-xs font-medium">Menu</span>
          </button>

          {/* Apply Button */}
          <Link href={applyUrl}>
            <Button className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3">
              Apply Now
            </Button>
          </Link>
        </div>

        {/* Progress indicator */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-brand-blue-600 transition-all duration-300"
            style={{
              width: `${Math.min((lastScrollY / (document?.body?.scrollHeight || 1)) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Desktop Sticky CTA (subtle) */}
      <div
        className={`
          hidden md:block fixed bottom-4 right-4 z-50
          transition-all duration-300 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <div className="flex gap-2">
          <a
            href={`sms:${textNumber}`}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Text Us</span>
          </a>

          <a
            href={`tel:${phoneNumber.replace(/[^0-9]/g, '')}`}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105"
          >
            <Phone className="w-5 h-5" />
            <span className="font-medium">Call</span>
          </a>
        </div>
      </div>
    </>
  );
}

export default StickyMobileCTA;
