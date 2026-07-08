import { redirect } from 'next/navigation';

export default function LearnerDashboardPage() {
  // Learner/student dashboard - redirect to LMS dashboard
  redirect('/lms/dashboard');
}
