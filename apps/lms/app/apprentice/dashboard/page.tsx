import type { Metadata } from 'next';
import ApprenticePortalPage from '../page';

// Backward-compatible path for saved bookmarks. Render the canonical dashboard
// directly so signed-in apprentices do not take an avoidable redirect hop.
export const metadata: Metadata = {
  title: 'Apprentice Dashboard',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default ApprenticePortalPage;
