import { redirect } from 'next/navigation';
export const metadata = { title: 'Employer Hiring and Training Needs', robots: { index: false, follow: false } };
export default function EmployerHiringNeedsEntry() {
  redirect('https://lms.elevateforhumanity.org/employer/hiring-needs');
}
