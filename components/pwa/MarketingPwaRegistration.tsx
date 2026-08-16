import { CanonicalPwaRegistration } from './CanonicalPwaRegistration';

/**
 * Registers the one canonical service worker for the marketing origin.
 * Any legacy root-scope worker (for example /sw.js) is removed first so an
 * older registration cannot continue controlling Marketing after a deploy.
 */
export function MarketingPwaRegistration() {
  return <CanonicalPwaRegistration application="marketing" />;
}
