import LearnerDocumentsPage from '@/apps/lms/app/lms/(app)/documents/page';
import { EnrollmentWorkspaceNavigation } from '@/components/enrollment/EnrollmentWorkspaceNavigation';
export const dynamic = 'force-dynamic';
/** Use the persisted requirement register; never reset saved uploads in client state. */
export default function EnrollmentDocumentsPage() {
 return <><EnrollmentWorkspaceNavigation /><LearnerDocumentsPage /></>;
}
