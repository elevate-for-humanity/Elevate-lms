'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, MessageCircle } from 'lucide-react';
import ParisChat from './ParisChat';
import type { ParisLearnerContext } from './ParisFloatingWrapper';
import { PARIS_PORTAL_ISSUE_EVENT, type PortalSupportIssue } from '@/lib/paris/portal-support';

export function ParisFloatingButton({
  surface = 'public',
  courseTitle,
  nextLessonTitle,
  courseProgress,
  portalRole,
}: ParisLearnerContext) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalIssue, setPortalIssue] = useState<PortalSupportIssue | null>(null);
  const pathname = usePathname();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const learnerSurface = surface === 'learner';
  const portalSurface = surface === 'portal';
  const assistantLabel = learnerSurface ? 'PARIS Learning Assistant' : portalSurface ? 'PARIS Portal Assistant' : 'PARIS Career Assistant';

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
          className="fixed inset-0 z-[9999] flex h-[100dvh] items-stretch overscroll-contain sm:pointer-events-none sm:items-end sm:justify-end sm:p-6 sm:pb-24"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={close}
            aria-hidden="true"
          />

          <div className="pointer-events-auto relative z-10 ml-auto flex h-[100dvh] min-h-0 w-full max-w-full flex-col overflow-hidden bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl animate-in slide-in-from-right-0 fade-in duration-200 sm:h-[min(680px,calc(100dvh-8rem))] sm:w-[min(480px,calc(100vw-3rem))] sm:rounded-2xl sm:border sm:border-slate-200 sm:pb-0">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-sm sm:text-base font-bold shrink-0">
                  P
                </div>
                <div>
                  <span className="block font-bold text-slate-800 text-base sm:text-lg">
                    {learnerSurface ? 'PARIS Learning Assistant' : 'PARIS Career Assistant'}
                  </span>
                  <span className="block max-w-[300px] truncate text-xs text-slate-600">
                    {learnerSurface ? courseTitle || 'Your Elevate coursework' : portalSurface ? `${portalRole || 'Authenticated'} workspace help` : 'Admissions and career navigation'}
                  </span>
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

            <div className="flex-1 overflow-hidden min-h-0">
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

      <button
        onClick={open}
        aria-label={learnerSurface ? 'Open PARIS Learning Assistant for course help' : portalSurface ? 'Open PARIS Portal Assistant' : 'Open PARIS Career Assistant'}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red-600 px-3 py-3 font-bold text-white shadow-xl transition-all hover:bg-brand-red-700 active:scale-95 sm:right-4 sm:px-4 md:bottom-6 md:right-6"
      >
        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{learnerSurface ? 'Ask PARIS · Course help' : portalSurface ? 'Ask PARIS · Portal help' : 'Ask PARIS'}</span>
      </button>
    </>
  );
}

export default ParisFloatingButton;
