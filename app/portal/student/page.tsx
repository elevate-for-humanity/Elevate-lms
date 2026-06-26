import { redirect } from 'next/navigation';

export const metadata = { 
  title: 'Student Portal | Elevate for Humanity',
  description: 'Access your courses, track progress, and manage your education.'
};

export default function StudentPortalPage() {
  // Redirect to the actual student dashboard
  redirect('/portal/portal/student/dashboard');
}
