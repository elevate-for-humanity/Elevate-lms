export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// Merged into /student-handbook (canonical, DB-driven, with acknowledgment tracking).
// Unique content from this variant (Program Schedule section) is documented in
// the canonical page's support services section.
export default function StudentHandbookRedirect() {
  redirect('/student-handbook');
}
