import { redirect } from 'next/navigation';

// Mentor messages not yet implemented. Redirect to mentor dashboard.
export default function Page() {
  redirect('/mentor/dashboard');
}
