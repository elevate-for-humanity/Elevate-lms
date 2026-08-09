/**
 * /terms - Legacy route redirecting to canonical /legal
 */
import { permanentRedirect } from 'next/navigation';

export default function TermsRedirect() {
  permanentRedirect('/legal');
}

export const metadata = {
  title: 'Terms of Service',
  description: 'Elevate for Humanity Terms of Service',
  robots: { index: false, follow: true },
};
