import { redirect } from 'next/navigation';

// /partner/programs has no index — redirect to partner dashboard
export default function PartnerProgramsPage() {
  redirect('/partner/dashboard');
}
