export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// Legacy HVAC course home — consolidated into /lms/courses/[courseId]
// Canonical: /lms/courses/0ba9a61c-1f1b-4019-be6f-90e92eba2bc0
export default function HvacCourseRedirect() {
  redirect('/lms/courses/0ba9a61c-1f1b-4019-be6f-90e92eba2bc0');
}
