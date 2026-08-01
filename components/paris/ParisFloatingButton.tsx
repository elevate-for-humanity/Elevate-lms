'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import - only loads on client side to prevent SSR/hydration issues
const ParisChat = dynamic(() => import('./ParisChat'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        <span className="text-sm">Loading assistant...</span>
      </div>
    </div>
  ),
});

export function ParisFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-open removed — triggered manually by user click to prevent SSR issues
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleFloatingMouseEnter = () => {
    tooltipTimer.current = setTimeout(() => setShowTooltip(true), 400);
  };
  const handleFloatingMouseLeave = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
    setShowTooltip(false);
  };

  return (
    <>
      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Paris AI Assistant"
          className="fixed inset-0 z-[9999] flex items-stretch"
        >
          {/* Backdrop — click to close on mobile, fixed panel on desktop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Chat Panel — full-screen mobile, right-side panel on tablet/desktop */}
          <div className="relative z-10 ml-auto w-full sm:w-[min(100vw,640px)] lg:w-[min(100vw,720px)] h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-right-0 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-sm sm:text-base font-bold shrink-0">
                  P
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-base sm:text-lg">Paris AI</span>
                  <span className="hidden sm:block text-xs text-slate-500 ml-2">Career Guidance Assistant</span>
                </div>
              </div>
              <button
                onClick={close}
                aria-label="Close chat"
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat body — fills remaining height */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ParisChat showHeader={false} />
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={open}
        onMouseEnter={handleFloatingMouseEnter}
        onMouseLeave={handleFloatingMouseLeave}
        aria-label="Chat with Paris AI"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-red-600 hover:bg-brand-red-700 active:scale-95 transition-all shadow-xl flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="fixed bottom-24 right-6 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[190px]">
            <p className="font-medium">Need help choosing a program?</p>
            <p className="text-slate-300 mt-0.5">Chat with Paris — our AI career assistant</p>
          </div>
        </div>
      )}
    </>
  );
}

export default ParisFloatingButton;
