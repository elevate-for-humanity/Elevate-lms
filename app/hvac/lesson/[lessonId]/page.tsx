import { redirect } from 'next/navigation';

// Legacy HVAC lesson renderer — consolidated into /lms/courses/[courseId]
// Canonical: /lms/courses/0ba9a61c-1f1b-4019-be6f-90e92eba2bc0
export default function HvacLessonRedirect() {
  redirect('/lms/courses/0ba9a61c-1f1b-4019-be6f-90e92eba2bc0');
}
