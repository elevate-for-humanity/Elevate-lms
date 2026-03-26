export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// Merged into /student-handbook (canonical, DB-driven, with acknowledgment tracking).
// Unique content from this variant (Safety & Emergency, Academic Standards sections)
// is covered in the canonical page under Academic Integrity and Support Services.
export default function StudentPortalHandbookRedirect() {
  redirect('/student-handbook');
}
