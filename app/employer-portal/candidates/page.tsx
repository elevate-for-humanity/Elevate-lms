export const dynamic = 'force-dynamic';
export const revalidate = 3600;

import { redirect } from 'next/navigation';

export default function EmployerPortalCandidatesPage() {
  redirect('/employer/candidates');
}
