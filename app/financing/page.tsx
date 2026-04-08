import { redirect } from 'next/navigation';

// Financing page not yet implemented. Redirect to enrollment.
export default function Page() {
  redirect('/enrollment');
}
