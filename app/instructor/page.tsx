import { redirect } from 'next/navigation';

export default function InstructorPage() {
  // Redirect to the admin instructor dashboard
  redirect('/admin/instructor/dashboard');
}
