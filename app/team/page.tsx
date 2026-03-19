import { redirect } from 'next/navigation';

// /team is linked from the footer. Canonical page is /about/team.
export default function TeamPage() {
  redirect('/about/team');
}
