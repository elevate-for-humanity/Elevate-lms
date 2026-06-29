'use client';
import { redirect } from 'next/navigation';

interface LicenseeOnboardingFormProps {
  currentStep: number;
  license: any;
  organization: any;
  user: any;
  requiredAgreements: any[];
  acceptedAgreements: string[];
}

export default function LicenseeOnboardingForm(props: LicenseeOnboardingFormProps) {
  // Redirect to license page for now
  redirect('/license');
}
