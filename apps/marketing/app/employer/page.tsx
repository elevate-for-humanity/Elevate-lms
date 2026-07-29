import { redirect } from 'next/navigation';

// /employer is the authenticated employer portal (see /employer/dashboard, etc.)
// The public employer marketing page is at /employers
export default function EmployerRootRedirect() {
  redirect('/employers');
}
