import { CanonicalPwaRegistration } from './CanonicalPwaRegistration';

/**
 * Registers the LMS domain service worker (sw-lms.js).
 * Mount once in the LMS root layout.
 */
export function LmsPwaRegistration() {
  return <CanonicalPwaRegistration application="lms" />;
}
