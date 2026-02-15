import { logger } from '@/lib/logger';
'use client';

import { useEffect, useRef } from 'react';
import { getPageLoadMessage, getAvatarConfig } from '@/lib/avatar-config';

/**
 * useAvatarOnLoad Hook
 * 
 * Triggers avatar speech ONCE on page load.
 * 
 * Rules:
 * - Executes only in layout-level components
 * - Never inside individual pages
 * - One message per pageId per session
 * - No scroll/hover/focus triggers
 * 
 * Usage:
 * ```tsx
 * useAvatarOnLoad('/programs/cna');
 * ```
 */
export function useAvatarOnLoad(pageId: string | undefined) {
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (!pageId) return;
    if (hasSpoken.current) return;

    // DEV-ONLY: Enforcement warnings
    if (process.env.NODE_ENV === 'development') {
      const config = getAvatarConfig(pageId);
      
      // Warn if enabled but no message
      if (config.enabled && config.speakOnLoad && !config.message) {
        logger.warn(
          `[AvatarEngine] Avatar enabled but no message for: ${pageId}`
        );
      }
      
      // Warn if disabled without being explicitly silent
      if (!config.enabled && config.message) {
        logger.warn(
          `[AvatarEngine] Avatar has message but is disabled: ${pageId}`
        );
      }
      
      // Warn about potential marketing pages without config
      const marketingPatterns = ['/about', '/contact', '/careers', '/funding', '/testimonials'];
      const isMarketingPage = marketingPatterns.some(p => pageId.startsWith(p));
      if (isMarketingPage && !config.enabled) {
        logger.warn(
          `[AvatarEngine] Marketing page without avatar config: ${pageId}`
        );
      }
    }

    const message = getPageLoadMessage(pageId);
    
    if (message) {
      // Mark as spoken before async operations
      hasSpoken.current = true;
      
      // Dispatch custom event for avatar UI to handle
      window.dispatchEvent(new CustomEvent('avatar-speak', {
        detail: { message, pageId }
      }));
    }
  }, [pageId]);
}

/**
 * useAvatarListener Hook
 * 
 * Listen for avatar speech events in your avatar UI component.
 * 
 * Usage:
 * ```tsx
 * useAvatarListener((message) => {
 *   // Play TTS or show text
 *   speak(message);
 * });
 * ```
 */
export function useAvatarListener(onSpeak: (message: string, pageId: string) => void) {
  useEffect(() => {
    const handler = (event: CustomEvent<{ message: string; pageId: string }>) => {
      onSpeak(event.detail.message, event.detail.pageId);
    };

    window.addEventListener('avatar-speak', handler as EventListener);
    return () => window.removeEventListener('avatar-speak', handler as EventListener);
  }, [onSpeak]);
}

export default useAvatarOnLoad;
