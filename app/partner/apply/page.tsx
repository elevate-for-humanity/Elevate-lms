import { redirect } from 'next/navigation';

// /partner/apply was a generic intake form that overlapped with program-specific
// application flows. All partner onboarding now goes through /partner/onboarding.
export default function PartnerApplyRedirect() {
  redirect('/partner/onboarding');
}
