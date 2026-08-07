import { permanentRedirect } from 'next/navigation';

/**
 * Legacy accreditation URL.
 *
 * Institutional approvals, registrations, certifications, governance, and
 * testing partnerships are maintained on /approvals so public compliance
 * claims have one source of truth.
 */
export default function AccreditationPage() {
  permanentRedirect('/approvals');
}
