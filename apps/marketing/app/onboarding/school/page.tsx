import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function SchoolOnboardingBridge() {
  redirect('https://app.elevateforhumanity.org/program-holder/onboarding');
}
