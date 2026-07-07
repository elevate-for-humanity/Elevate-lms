import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Staff Onboarding',
  description: 'Staff onboarding process.',
};

export default function StaffOnboardingPage() {
  redirect('/onboarding');
}
