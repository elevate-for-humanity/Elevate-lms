import LearnerOrientationPage from '@/apps/lms/app/lms/(app)/orientation/page';
import { EnrollmentWorkspaceNavigation } from '@/components/enrollment/EnrollmentWorkspaceNavigation';
export const dynamic = 'force-dynamic';
/** Reuse the authenticated acknowledgement action and program-specific content. */
export default function EnrollmentOrientationPage() {
 return <><EnrollmentWorkspaceNavigation /><LearnerOrientationPage /></>;
}
