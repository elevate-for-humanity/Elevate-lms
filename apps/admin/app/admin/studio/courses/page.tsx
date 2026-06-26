import { redirect } from 'next/navigation';

// Legacy alias - redirect to dev-studio courses tab
// No auth check needed here since /admin/studio has its own auth
export default function StudioIndexPage() {
  redirect('/admin/studio?tab=courses');
}
