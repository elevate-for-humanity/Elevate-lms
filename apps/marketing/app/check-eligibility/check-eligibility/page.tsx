import { permanentRedirect } from 'next/navigation';

export default function DuplicateEligibilityRoute() {
  permanentRedirect('/check-eligibility');
}
