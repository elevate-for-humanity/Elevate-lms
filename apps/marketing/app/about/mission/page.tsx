import { permanentRedirect } from 'next/navigation';

/**
 * Legacy mission URL.
 *
 * Mission, purpose, organizational model, values, and workforce-development
 * positioning are maintained on /about. Preserve this URL for old links while
 * preventing a second copy of organizational content from drifting over time.
 */
export default function MissionPage() {
  permanentRedirect('/about');
}
