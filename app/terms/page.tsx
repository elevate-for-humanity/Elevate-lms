/**
 * /terms - Legacy route redirecting to canonical /terms-of-service
 */
import { redirect } from 'next/navigation';

export default function TermsRedirect() {
  redirect('/terms-of-service');
}

export const metadata = {
  title: 'Terms of Service',
  description: 'Elevate for Humanity Terms of Service',
};
