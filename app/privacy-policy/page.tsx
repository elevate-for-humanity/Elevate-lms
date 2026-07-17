export const dynamic = 'force-dynamic';
// Canonical privacy policy lives at /legal/privacy — redirect permanently.
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Privacy Policy | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Privacy policy for ${PLATFORM_DEFAULTS.orgName} career training programs and services.`,
  robots: { index: false, follow: false },
};

export default function PrivacyPolicyRedirect() {
  redirect('/legal/privacy');
}
