'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { getPageLoadMessage } from '@/lib/avatar-config';

/**
 * AvatarProvider
 *
 * Wrap your app with this to enable automatic avatar speech on page load.
 *
 * Rules:
 * - Speaks ONCE per page per session
 * - No speech on silent pages (policies, tests, etc.)
 * - Dispatches 'avatar-speak' event for UI components to handle
 *
 * Usage in layout.tsx:
 * ```tsx
 * <AvatarProvider>
 *   {children}
 * </AvatarProvider>
 * ```
 */
export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const spokenPaths = useRef(new Set<string>());
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same path (prevents double-speak on re-renders)
    if (pathname === lastPathname.current) return;
    lastPathname.current = pathname;

    // Skip if already spoken on this path this session
    if (spokenPaths.current.has(pathname)) return;

    // Get message for this page
    const message = getPageLoadMessage(pathname);

    if (message) {
      // Mark as spoken
      spokenPaths.current.add(pathname);

      // Small delay to ensure page is rendered
      const timer = setTimeout(() => {
        // Dispatch event for avatar UI to handle
        window.dispatchEvent(
          new CustomEvent('avatar-speak', {
            detail: { message, pathname },
          }),
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return <>{children}</>;
}

/**
 * useAvatarSpeech Hook
 *
 * Use this in your avatar UI component to listen for speech events.
 *
 * Usage:
 * ```tsx
 * function AvatarUI() {
 *   const { message, isVisible } = useAvatarSpeech();
 *
 *   if (!isVisible) return null;
 *
 *   return <div>{message}</div>;
 * }
 * ```
 */
export function useAvatarSpeech() {
  const [state, setState] = useReducer(
    (
      prev: { message: string | null; isVisible: boolean; pathname: string | null },
      action: { type: 'speak'; message: string; pathname: string } | { type: 'dismiss' },
    ) => {
      if (action.type === 'speak') {
        return { message: action.message, isVisible: true, pathname: action.pathname };
      }
      if (action.type === 'dismiss') {
        return { ...prev, isVisible: false };
      }
      return prev;
    },
    { message: null, isVisible: false, pathname: null },
  );

  useEffect(() => {
    const handler = (event: CustomEvent<{ message: string; pathname: string }>) => {
      setState({ type: 'speak', message: event.detail.message, pathname: event.detail.pathname });

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setState({ type: 'dismiss' });
      }, 10000);
    };

    window.addEventListener('avatar-speak', handler as EventListener);
    return () => window.removeEventListener('avatar-speak', handler as EventListener);
  }, []);

  const dismiss = useCallback(() => {
    setState({ type: 'dismiss' });
  }, []);

  return { ...state, dismiss };
}

// Need to import useReducer
import { useReducer } from 'react';

export default AvatarProvider;
