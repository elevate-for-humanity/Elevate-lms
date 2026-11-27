import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

/**
 * Elevate Mail — the standalone Interoffice Email PWA.
 *
 * This layout only overrides the install identity (manifest, application
 * name, theme color) for the /mail scope. The bare shell itself is rendered
 * by AdminApplicationChrome (pathname-keyed, like /staff-portal) and the
 * mail service worker is registered by the root layout in place of the
 * Admin worker, so the inbox opens as its own app with no Admin chrome.
 */
export const metadata: Metadata = {
  title: {
    default: 'Elevate Mail',
    template: '%s | Elevate Mail',
  },
  description: 'Elevate for Humanity interoffice email: inbox, threads, and compose.',
  manifest: '/manifest-mail.json',
  applicationName: 'Elevate Mail',
  appleWebApp: {
    capable: true,
    title: 'Elevate Mail',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#153052',
};

export default function MailLayout({ children }: { children: ReactNode }) {
  return children;
}
