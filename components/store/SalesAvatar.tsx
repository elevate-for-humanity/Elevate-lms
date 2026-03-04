'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronRight, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface SalesMessage {
  id: string;
  type: 'intro' | 'value' | 'objection' | 'cta' | 'tip' | 'upsell';
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  delay?: number; // ms before showing
}

interface SalesAvatarProps {
  productId?: string;
  pageName: string;
  messages: SalesMessage[];
  avatarImage?: string;
  avatarName?: string;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  autoStart?: boolean;
  showOnScroll?: number; // Show after scrolling X pixels
}

export default function SalesAvatar({
  productId,
  pageName,
  messages,
  avatarImage = '/images/pages/store-recommendations.jpg',
  avatarName = 'Maya',
  position = 'bottom-right',
  autoStart = true,
  showOnScroll,
}: SalesAvatarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  const currentMessage = messages[currentMessageIndex];
  const hasMoreMessages = currentMessageIndex < messages.length - 1;

  // Check localStorage for dismissed state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const dismissedKey = `avatar-dismissed-${pageName}`;
    const dismissed = localStorage.getItem(dismissedKey);
    
    if (dismissed) {
      setIsMinimized(true);
      return;
    }

    if (showOnScroll) {
      const handleScroll = () => {
        if (window.scrollY > showOnScroll && !isVisible) {
          setIsVisible(true);
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } else if (autoStart) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [pageName, autoStart, showOnScroll, isVisible]);

  // Typing effect
  useEffect(() => {
    if (!isVisible || isMinimized || !currentMessage) return;

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;

    if (typingRef.current) clearInterval(typingRef.current);

    typingRef.current = setInterval(() => {
      if (index < currentMessage.message.length) {
        setDisplayedText(currentMessage.message.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        if (typingRef.current) clearInterval(typingRef.current);
      }
    }, 25);

    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [currentMessageIndex, isVisible, isMinimized, currentMessage]);

  const handleNext = () => {
    setHasInteracted(true);
    if (hasMoreMessages) {
      setCurrentMessageIndex(currentMessageIndex + 1);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`avatar-dismissed-${pageName}`, 'true');
    }
  };

  const handleReopen = () => {
    setIsMinimized(false);
    setIsVisible(true);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`avatar-dismissed-${pageName}`);
    }
  };

  // Minimized state - small floating button
  if (isMinimized) {
    return (
      <button
        onClick={handleReopen}
        className={`fixed ${position === 'bottom-left' ? 'left-4' : 'right-4'} bottom-4 z-50 flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105`}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
          <Image src={avatarImage} alt={avatarName} width={32} height={32} className="object-cover" />
        </div>
        <span className="font-medium text-sm">Chat with {avatarName}</span>
      </button>
    );
  }

  if (!isVisible) return null;

  // Inline position (embedded in page)
  if (position === 'inline') {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-brand-orange-500">
                <Image src={avatarImage} alt={avatarName} width={64} height={64} className="object-cover" />
              </div>
              {isTyping && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-slate-400 mt-2">{avatarName}</p>
          </div>
          
          <div className="flex-1">
            <div className="bg-white/10 rounded-xl rounded-tl-none p-4 mb-3">
              <p className="text-white leading-relaxed">
                {displayedText}
                {isTyping && <span className="inline-block w-2 h-4 bg-brand-orange-500 ml-1 animate-pulse" />}
              </p>
            </div>

            {!isTyping && currentMessage?.action && (
              <div className="mb-3">
                {currentMessage.action.href ? (
                  <Link
                    href={currentMessage.action.href}
                    className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    {currentMessage.action.label}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={currentMessage.action.onClick}
                    className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-lg font-medium transition"
                  >
                    {currentMessage.action.label}
                  </button>
                )}
              </div>
            )}

            {!isTyping && hasMoreMessages && (
              <button
                onClick={handleNext}
                className="text-sm text-brand-orange-400 hover:text-brand-orange-300 font-medium"
              >
                Tell me more →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Floating position
  return (
    <div className={`fixed ${position === 'bottom-left' ? 'left-4' : 'right-4'} bottom-4 z-50 w-80 max-w-[calc(100vw-2rem)]`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-orange-500">
              <Image src={avatarImage} alt={avatarName} width={40} height={40} className="object-cover" />
            </div>
            <div>
              <p className="font-medium text-sm">{avatarName}</p>
              <p className="text-xs text-slate-400">Sales Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 hover:bg-white/10 rounded transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleMinimize}
              className="p-1.5 hover:bg-white/10 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="p-4">
          {/* Message type badge */}
          {currentMessage?.type === 'upsell' && (
            <div className="flex items-center gap-1 text-brand-orange-600 text-xs font-medium mb-2">
              <Sparkles className="w-3 h-3" />
              Recommendation
            </div>
          )}
          
          <p className="text-gray-800 leading-relaxed min-h-[60px]">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 bg-brand-orange-500 ml-1 animate-pulse" />}
          </p>

          {/* Action button */}
          {!isTyping && currentMessage?.action && (
            <div className="mt-3">
              {currentMessage.action.href ? (
                <Link
                  href={currentMessage.action.href}
                  className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
                >
                  {currentMessage.action.label}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={currentMessage.action.onClick}
                  className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
                >
                  {currentMessage.action.label}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex gap-1">
            {messages.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentMessageIndex ? 'bg-brand-orange-500 w-4' : index < currentMessageIndex ? 'bg-brand-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          {!isTyping && hasMoreMessages && (
            <button
              onClick={handleNext}
              className="text-sm text-brand-orange-600 hover:text-brand-orange-700 font-medium flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Pre-built message sets for common pages
export const STORE_LANDING_MESSAGES: SalesMessage[] = [
  {
    id: 'welcome',
    type: 'intro',
    message: "Welcome to the Elevate Store! I'm Maya, and I'll help you find exactly what you need. Whether you're a student, instructor, or running a training organization - we've got you covered.",
  },
  {
    id: 'categories',
    type: 'value',
    message: "We have five main areas: Shop for gear and tools, Marketplace for courses, Workbooks for study materials, Platform Licenses if you want to run your own training program, and Compliance Tools for WIOA/FERPA requirements.",
  },
  {
    id: 'popular',
    type: 'tip',
    message: "Our most popular product is the School License - it's a complete white-label platform that training providers use to run WIOA-funded programs. One cohort can pay for the entire license!",
    action: {
      label: 'See School License',
      href: '/store/licenses/school-license',
    },
  },
];

export const LICENSE_PAGE_MESSAGES: SalesMessage[] = [
  {
    id: 'intro',
    type: 'intro',
    message: "You're looking at our platform licenses - this is how training providers, schools, and workforce agencies run their programs on our technology.",
  },
  {
    id: 'value',
    type: 'value',
    message: "The School License is our most popular. For $15,000 one-time, you get a complete white-label LMS with your branding, WIOA compliance built in, student enrollment, and a partner dashboard for employers.",
  },
  {
    id: 'roi',
    type: 'objection',
    message: "Here's the math: One WIOA-funded training cohort of 10 students can bring in $50,000+ in revenue. The license pays for itself with your first cohort.",
  },
  {
    id: 'cta',
    type: 'cta',
    message: "Want to see it in action? I can show you a live demo of what your platform would look like.",
    action: {
      label: 'Try Free Demo',
      href: '/demo',
    },
  },
];

export const COMPLIANCE_PAGE_MESSAGES: SalesMessage[] = [
  {
    id: 'intro',
    type: 'intro',
    message: "Compliance can be overwhelming - WIOA, FERPA, WCAG, grant reporting... I get it. That's why we built tools that automate the hard parts.",
  },
  {
    id: 'wioa',
    type: 'value',
    message: "The WIOA Toolkit alone saves 40+ hours per quarter. One-click PIRL exports, automated performance tracking, and pre-built quarterly reports. What used to take a week now takes 10 minutes.",
  },
  {
    id: 'bundle',
    type: 'upsell',
    message: "Pro tip: If you need WIOA, FERPA, and grant reporting, the School License includes ALL of them built in - plus the full LMS. Better value than buying tools separately.",
    action: {
      label: 'Compare Options',
      href: '/store/licenses',
    },
  },
];

export const SHOP_PAGE_MESSAGES: SalesMessage[] = [
  {
    id: 'intro',
    type: 'intro',
    message: "Welcome to the shop! Here you'll find professional tools, equipment, scrubs, and study materials for training programs.",
  },
  {
    id: 'categories',
    type: 'tip',
    message: "Use the category filters to find what you need - Tools, Apparel, Books, Safety gear, and Accessories. Everything is student-priced.",
  },
  {
    id: 'bulk',
    type: 'value',
    message: "Running a training program? We offer bulk pricing for schools and training providers. Contact us for volume discounts.",
    action: {
      label: 'Contact for Bulk Pricing',
      href: '/contact?topic=bulk-pricing',
    },
  },
];

export const MARKETPLACE_PAGE_MESSAGES: SalesMessage[] = [
  {
    id: 'intro',
    type: 'intro',
    message: "This is our course marketplace - expert-created training in trades, healthcare, technology, and business. Learn from people who actually do the work.",
  },
  {
    id: 'quality',
    type: 'value',
    message: "Every course is vetted for quality. You'll see ratings, student counts, and duration so you know what you're getting. Most courses include certificates.",
  },
  {
    id: 'creator',
    type: 'tip',
    message: "Are you an expert in your field? You can create and sell courses here too. We handle payments, hosting, and marketing - you focus on teaching.",
    action: {
      label: 'Become a Creator',
      href: '/marketplace/sell',
    },
  },
];

export const WORKBOOKS_PAGE_MESSAGES: SalesMessage[] = [
  {
    id: 'intro',
    type: 'intro',
    message: "All workbooks and study guides are free for enrolled students. Download, print, and use them for your program.",
  },
  {
    id: 'programs',
    type: 'tip',
    message: "Not enrolled yet? Check out our training programs - Barbering, CNA, HVAC, CDL, and more. Many are WIOA-funded, meaning they could be free for you.",
    action: {
      label: 'See Training Programs',
      href: '/programs',
    },
  },
  {
    id: 'provider',
    type: 'upsell',
    message: "If you're a training provider, you can create your own workbooks and courses with our platform. The School License includes a full course builder.",
    action: {
      label: 'Learn About Licensing',
      href: '/store/licenses',
    },
  },
];
