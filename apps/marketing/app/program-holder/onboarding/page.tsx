export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';

export default function ProgramHolderOnboardingPage() {
  redirect('/program-holder');
}
