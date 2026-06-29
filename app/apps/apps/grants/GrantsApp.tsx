import { redirect } from 'next/navigation';

interface GrantsAppProps {
  user: any;
  subscription: any;
  opportunities: any[];
  savedGrants: any[];
  applications: any[];
  trialDaysRemaining: number;
}

export function GrantsApp(props: GrantsAppProps) {
  // Redirect to main grants page
  redirect('/apps/grants');
}
