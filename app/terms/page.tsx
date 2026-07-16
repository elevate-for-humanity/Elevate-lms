/**
 * /terms - Legacy route redirecting to canonical /legal
 */
import { redirect } from 'next/navigation';

export default function TermsRedirect() {
  redirect('/legal');
}

export const metadata = {
  title: 'Terms of Service',
  description: 'Elevate for Humanity Terms of Service',
};
