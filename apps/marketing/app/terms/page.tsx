/**
 * /terms - Legacy alias for canonical /terms-of-service
 */
import { permanentRedirect } from 'next/navigation';

export default function TermsRedirect() {
  permanentRedirect('/terms-of-service');
}

export const metadata = {
  title: 'Terms of Service',
  description: 'Elevate for Humanity Terms of Service',
  robots: { index: false, follow: true },
};
