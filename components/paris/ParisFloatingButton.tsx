'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, MessageCircle } from 'lucide-react';

const ParisChat = dynamic(() => import('./ParisChat'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-brand-red-600 border-t-transparent rounded-full" />
    </div>
  ),
});

const STORAGE_KEY = 'paris-chat-dismissed';

export function ParisFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-open after 2s for first-time visitors
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        autoTimer.current = setTimeout(() => setIsOpen(true), 2000);
      }
    } catch { /* sessionStorage unavailable */ }
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  }, []);

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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-4"
        >
          {/* Backdrop — click anywhere to close */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Chat Window */}
          <div className="relative z-10 w-full sm:w-[420px] sm:max-w-[calc(100vw-2rem)] h-[88vh] sm:h-[600px] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 fade-in duration-200">
            {/* Header — shared with ParisChat, just show dismiss/close */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  P
                </div>
                <span className="font-semibold text-slate-800 text-sm">Paris AI</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDismiss}
                  title="Don't show again this session"
                  className="text-slate-400 hover:text-slate-600 text-xs px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={close}
                  aria-label="Close chat"
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat body */}
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
