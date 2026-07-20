// Alias for /admin/studio - dev-studio is used in navigation
export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';
export default function DevStudioPage() {
  redirect('/admin/studio');
}
