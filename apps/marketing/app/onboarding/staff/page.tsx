import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Staff Onboarding',
  description: 'Staff onboarding process.',
  robots: { index: false, follow: false },
};

export default function StaffOnboardingPage() {
  redirect('/onboarding');
}
