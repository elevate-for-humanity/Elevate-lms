import { permanentRedirect } from 'next/navigation';

/**
 * Historical platform-disclosures URL. Current consumer-facing disclosures are
 * maintained at one canonical route so funding, credential, employment, and
 * platform statements do not drift across duplicate legal pages.
 */
export default function LegacyDisclosuresPage() {
  permanentRedirect('/consumer-disclosures');
}
