'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface TidioChatWidgetProps {
  publicKey?: string;
  autoOpen?: boolean;
  autoOpenDelay?: number;
}

/**
 * Tidio Chat Widget Integration
 * 
 * This component loads the Tidio chat widget with the Program Fit Assistant
 * AI configuration. The AI system prompt and conversation flows are configured
 * in the Tidio dashboard.
 * 
 * Setup Instructions:
 * 1. Create a Tidio account at tidio.com
 * 2. Set up Lyro AI Assistant with the system prompt from lib/chatbot/config.ts
 * 3. Add your Tidio public key to NEXT_PUBLIC_TIDIO_KEY environment variable
 * 4. Configure welcome message, quick replies, and document triggers in Tidio dashboard
 */
export function TidioChatWidget({
  publicKey,
  autoOpen = false,
  autoOpenDelay = 12000,
}: TidioChatWidgetProps) {
  const tidioKey = publicKey || process.env.NEXT_PUBLIC_TIDIO_KEY;

  useEffect(() => {
    // Auto-open chat after delay if enabled
    if (autoOpen && window.tidioChatApi) {
      const timer = setTimeout(() => {
        window.tidioChatApi?.open();
      }, autoOpenDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoOpen, autoOpenDelay]);

  useEffect(() => {
    // Set up Tidio event listeners when API is ready
    const setupTidio = () => {
      if (window.tidioChatApi) {
        // Track when chat is opened for analytics
        window.tidioChatApi.on('open', () => {
          // Could send analytics event here
          // console.log('[Tidio] Chat opened');
        });

        // Track when chat is closed
        window.tidioChatApi.on('close', () => {
          // console.log('[Tidio] Chat closed');
        });
      }
    };

    // Check if Tidio is already loaded
    if (window.tidioChatApi) {
      setupTidio();
      return undefined;
    } else {
      // Wait for Tidio to load
      document.addEventListener('tidioChat-ready', setupTidio);
      return () => {
        document.removeEventListener('tidioChat-ready', setupTidio);
      };
    }
  }, []);

  // Don't render if no key is configured
  if (!tidioKey) {
    console.warn('[Tidio] No public key configured. Set NEXT_PUBLIC_TIDIO_KEY environment variable.');
    return null;
  }

  return (
    <Script
      src={`//code.tidio.co/${tidioKey}.js`}
      strategy="lazyOnload"
      onLoad={() => {
        // console.log('[Tidio] Script loaded');
      }}
      onError={() => {
        console.error('[Tidio] Failed to load script');
      }}
    />
  );
}

/**
 * Helper functions to control Tidio chat programmatically
 */
export const tidioChat = {
  open: () => window.tidioChatApi?.open(),
  close: () => window.tidioChatApi?.close(),
  show: () => window.tidioChatApi?.show(),
  hide: () => window.tidioChatApi?.hide(),
  setVisitorData: (data: Record<string, unknown>) => 
    window.tidioChatApi?.setVisitorData(data),
};
