import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function PortalIndexPage() {
  // Redirect to student portal - apprentice routes are deprecated
  redirect('/portal/student');
}
