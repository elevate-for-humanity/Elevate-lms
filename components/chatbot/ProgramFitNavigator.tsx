'use client';

import { useState } from 'react';
import { ArrowRight, HelpCircle, X } from 'lucide-react';

interface ProgramFitNavigatorProps {
  variant?: 'card' | 'inline' | 'minimal';
  className?: string;
}

/**
 * Program Fit Navigator - Institutional intake component
 * 
 * Placement guidelines:
 * - Homepage: Right side, above the fold (card variant)
 * - Programs page: After first section (inline variant)
 * - Footer: Link only (minimal variant)
 */
export function ProgramFitNavigator({ 
  variant = 'card',
  className = '' 
}: ProgramFitNavigatorProps) {
  const [showInfo, setShowInfo] = useState(false);

  const openChat = () => {
    // Open Tidio chat if available
    if (typeof window !== 'undefined' && window.tidioChatApi) {
      window.tidioChatApi.open();
    } else {
      // Fallback: scroll to chat or show modal
      const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
      if (chatButton) {
        chatButton.click();
      }
    }
  };

  // Minimal variant - just a link
  if (variant === 'minimal') {
    return (
      <button
        onClick={openChat}
        className={`text-sm text-gray-600 hover:text-brand-blue-600 transition-colors ${className}`}
      >
        Program Fit Review
      </button>
    );
  }

  // Inline variant - horizontal banner
  if (variant === 'inline') {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-6 ${className}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-gray-700 font-medium">
              Not sure if this platform fits your program structure?
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Built for institutions managing enrollment, compliance, and credentialed outcomes.
            </p>
          </div>
          <button
            onClick={openChat}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors whitespace-nowrap"
          >
            Run a Program Fit Review
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Card variant - full featured panel
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            Program Fit Navigator
          </h3>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 text-white/80 hover:text-white transition-colors"
            aria-label="What is this?"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-brand-blue-100 mt-1">
          Guided intake for institutions evaluating program operations and credentialing systems.
        </p>
      </div>

      {/* Info panel (expandable) */}
      {showInfo && (
        <div className="bg-brand-blue-50 border-b border-brand-blue-100 px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What is this?</h4>
              <p className="text-sm text-gray-700">
                The Program Fit Navigator is a guided intake designed to help institutions 
                determine whether our platform is the right fit for their program operations. 
                It asks a small number of questions about scale, governance, and outcomes, 
                then recommends next steps. It does not collect sensitive data or commit 
                you to a sales process.
              </p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Built for institutions managing enrollment, compliance, and credentialed outcomes — not just course content.
        </p>

        <button
          onClick={openChat}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-blue-600 text-white font-semibold rounded-xl hover:bg-brand-blue-700 transition-colors"
        >
          See if this fits your program
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          5-minute guided review • No sales pressure
        </p>
      </div>
    </div>
  );
}

// Tidio API type is declared in types/gtag.d.ts
