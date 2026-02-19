import { redirect } from 'next/navigation';

// Redirect to the canonical enrollment agreement page
export default function LegalEnrollmentAgreementRedirect() {
  redirect('/enrollment-agreement');
}
