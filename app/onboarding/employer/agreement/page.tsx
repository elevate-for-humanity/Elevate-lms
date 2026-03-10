import { redirect } from 'next/navigation';

// The employer MOU/agreement page lives at /onboarding/mou.
// This redirect keeps the employer onboarding step link working.
export default function EmployerAgreementRedirect() {
  redirect('/onboarding/mou');
}
