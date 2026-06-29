import { redirect } from 'next/navigation';

interface SamGovAppProps {
  user: any;
  subscription: any;
  entities: any[];
  documents: any[];
  alerts: any[];
  trialDaysRemaining: number;
}

export function SamGovApp(props: SamGovAppProps) {
  // Redirect to main sam-gov page
  redirect('/apps/sam-gov');
}
