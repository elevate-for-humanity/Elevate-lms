import { redirect } from 'next/navigation';

interface WebsiteBuilderAppProps {
  user: any;
  subscription: any;
  websites: any[];
  trialDaysRemaining: number;
}

export function WebsiteBuilderApp(props: WebsiteBuilderAppProps) {
  // Redirect to main website-builder page
  redirect('/apps/website-builder');
}
