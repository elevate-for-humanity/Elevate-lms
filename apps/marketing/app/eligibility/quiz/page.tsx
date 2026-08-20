import { permanentRedirect } from 'next/navigation';

/**
 * Historical eligibility quiz. Funding eligibility belongs to the responsible
 * workforce agency; the canonical preparation checklist at /check-eligibility
 * intentionally does not return a qualified/not-qualified result.
 */
export default function EligibilityQuizPage() {
  permanentRedirect('/check-eligibility');
}
