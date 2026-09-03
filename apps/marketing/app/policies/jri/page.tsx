import { permanentRedirect } from 'next/navigation';

/**
 * Historical JRI policy URL retained only for inbound links and search cleanup.
 * Current government-facing status and disclosures are maintained in the
 * compliance center rather than in a duplicate funding-policy page.
 */
export default function LegacyJriPolicyPage() {
  permanentRedirect('/compliance/center');
}
