/**
 * Admin app route — JobBoardPanel on admin.elevateforhumanity.org calls this path.
 * Delegates to the LMS handler via relative path (@/ alias would recurse into this file).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export { GET, POST } from '../../../../../../app/api/jobs/government-feed/route';
