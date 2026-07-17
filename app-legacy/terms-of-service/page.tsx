export const dynamic = 'force-dynamic';
// Legacy route /terms-of-service redirects to canonical /legal
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Terms of Service | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Terms of service for ${PLATFORM_DEFAULTS.orgName} career training programs and services.`,
  robots: { index: false, follow: false },
};

export default function TermsOfServiceRedirect() {
  // Redirect legacy /terms-of-service to canonical /legal
  redirect('/legal');
}
