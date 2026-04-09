import { redirect } from 'next/navigation';

// Full job posting form lives at employer-portal/jobs/new
export default function Page() {
  redirect('/employer-portal/jobs/new');
}
