import { redirect } from 'next/navigation';

// Canonical URL is /agencies — redirect cleanly
export default function ForAgenciesRedirect() {
  redirect('/agencies');
}
