import { redirect } from 'next/navigation';

// WOTC page not yet implemented. Redirect to employer dashboard.
export default function Page() {
  redirect('/employer/dashboard');
}
