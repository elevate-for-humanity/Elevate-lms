import { redirect } from 'next/navigation';
export const metadata = { title: 'Employer Orientation', robots: { index: false, follow: false } };
export default function EmployerOrientationEntry() {
  redirect('https://lms.elevateforhumanity.org/employer/orientation');
}
