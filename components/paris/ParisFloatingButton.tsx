'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, MessageCircle, Mic } from 'lucide-react';
import ParisChat from './ParisChat';
import type { ParisLearnerContext } from './ParisFloatingWrapper';
import { PARIS_PORTAL_ISSUE_EVENT, type PortalSupportIssue } from '@/lib/paris/portal-support';

export function ParisFloatingButton({
  surface = 'public',
  courseTitle,
  nextLessonTitle,
  courseProgress,
  portalRole,
  autoOpenOnDashboard = false,
}: ParisLearnerContext) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [portalIssue, setPortalIssue] = useState<PortalSupportIssue | null>(null);
  const pathname = usePathname();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const learnerSurface = surface === 'learner';
  const portalSurface = surface === 'portal';
  const assistantLabel = learnerSurface
    ? 'PARIS Learning Assistant'
    : portalSurface
      ? 'PARIS Portal Assistant'
      : 'PARIS Career Assistant';

  useEffect(() => {
    if (autoOpenOnDashboard && pathname.endsWith('/dashboard')) setIsOpen(true);
  }, [autoOpenOnDashboard, pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [close, isOpen]);

  useEffect(() => {
    const handleIssue = (event: Event) => {
      const issue = (event as CustomEvent<PortalSupportIssue>).detail;
      if (!issue?.workflow || !issue.message) return;
      setPortalIssue(issue);
      setIsOpen(true);
      void fetch('/api/paris/workflow-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(issue),
      }).catch(() => undefined);
    };
    window.addEventListener(PARIS_PORTAL_ISSUE_EVENT, handleIssue);
    return () => window.removeEventListener(PARIS_PORTAL_ISSUE_EVENT, handleIssue);
  }, []);

  useEffect(() => {
    if (surface !== 'public' || pathname !== '/') {
      setShowWelcome(false);
      return;
    }
    try {
      if (window.sessionStorage.getItem('paris-home-welcome-seen') !== 'true') {
        setShowWelcome(true);
      }
    } catch {
      setShowWelcome(true);
    }
  }, [pathname, surface]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      window.sessionStorage.setItem('paris-home-welcome-seen', 'true');
    } catch {
      // The greeting can still be dismissed when browser storage is unavailable.
    }
  }, []);

  // Keep the information-dense Bookkeeping hero unobstructed. PARIS remains
  // available throughout authenticated portals and on other public pages.
  if (surface === 'public' && pathname === '/programs/bookkeeping') return null;

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={assistantLabel}
          className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen max-w-[100vw] items-stretch overflow-x-hidden overscroll-contain sm:pointer-events-none sm:items-end sm:justify-end sm:p-6 sm:pb-24"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={close}
            aria-hidden="true"
          />

          <div className="pointer-events-auto relative z-10 ml-auto flex h-[100dvh] min-h-0 min-w-0 w-full max-w-[100vw] flex-col overflow-hidden bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in slide-in-from-right-0 fade-in duration-200 sm:h-[min(680px,calc(100dvh-8rem))] sm:w-[min(480px,calc(100vw-3rem))] sm:rounded-2xl sm:border sm:border-slate-200 sm:pb-0">
            <div className="flex min-w-0 max-w-full items-center justify-between overflow-hidden px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-sm sm:text-base font-bold shrink-0">
                  P
                </div>
                <div>
                  <span className="block font-bold text-slate-800 text-base sm:text-lg">
                    {learnerSurface
                      ? 'PARIS Learning Assistant'
                      : portalSurface
                        ? 'PARIS Portal Assistant'
                        : 'PARIS Career Assistant'}
                  </span>
                  <span className="block max-w-[300px] truncate text-xs text-slate-600">
                    {learnerSurface
                      ? courseTitle || 'Your Elevate coursework'
                      : portalSurface
                        ? `${portalRole || 'Authenticated'} workspace help`
                        : 'Admissions and career navigation'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close PARIS"
                title="Close PARIS"
                style={{ width: 'auto', maxWidth: '45%' }}
                className="ml-2 inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 shadow-sm transition-colors hover:border-brand-red-300 hover:bg-brand-red-50 hover:text-brand-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 focus-visible:ring-offset-2"
              >
                <X className="h-5 w-5" aria-hidden="true" />
                <span className="hidden min-[380px]:inline">Close</span>
              </button>
            </div>

            <div className="min-h-0 min-w-0 max-w-full flex-1 overflow-hidden">
              <ParisChat
                showHeader={false}
                surface={surface}
                courseTitle={courseTitle}
                nextLessonTitle={nextLessonTitle}
                courseProgress={courseProgress}
                portalRole={portalRole}
                portalIssue={portalIssue}
                voiceEnabled
              />
            </div>
          </div>
        </div>
      )}

      {showWelcome && !isOpen ? (
        <div
          role="status"
          className="fixed bottom-[calc(9.25rem+env(safe-area-inset-bottom))] right-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl md:bottom-24 md:right-6"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-black text-slate-950">Hi, I’m PARIS.</p>
            <button
              type="button"
              onClick={dismissWelcome}
              aria-label="Close PARIS introduction"
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
            I’m here if you need guidance with programs, funding, applications, documents, employer
            opportunities, or your next step.
          </p>
          <p className="mt-3 text-xs font-bold text-brand-red-700">
            Ask a question by typing or using the microphone.
          </p>
          <button
            type="button"
            onClick={() => {
              dismissWelcome();
              open();
            }}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-4 py-3 font-black text-white shadow-md hover:bg-brand-red-700"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Open PARIS
          </button>
        </div>
      ) : null}

      <button
        onClick={() => {
          dismissWelcome();
          open();
        }}
        aria-label={
          learnerSurface
            ? 'Open PARIS Learning Assistant for course help'
            : portalSurface
              ? 'Open PARIS Portal Assistant'
              : 'Open PARIS Career Assistant'
        }
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red-600 px-3 py-3 font-bold text-white shadow-xl transition-all hover:bg-brand-red-700 active:scale-95 sm:right-4 sm:px-4 md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <Mic className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">
          {learnerSurface
            ? 'Ask PARIS · Course help'
            : portalSurface
              ? 'Ask PARIS · Portal help'
              : 'Ask PARIS'}
        </span>
      </button>
    </>
  );
}

export default ParisFloatingButton;
