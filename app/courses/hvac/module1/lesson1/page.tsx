export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// Legacy standalone HVAC lesson — consolidated into /lms/courses/[courseId]
// Canonical: /lms/courses/0ba9a61c-1f1b-4019-be6f-90e92eba2bc0
export default async function HvacLegacyLessonRedirect() {
  redirect('/lms/courses/0ba9a61c-1f1b-4019-be6f-90e92eba2bc0');
}
