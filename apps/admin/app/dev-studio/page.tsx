// Canonical Dev Studio route
// Redirects to the actual Dev Studio implementation at /admin/admin/studio
import { redirect } from 'next/navigation';

export default function DevStudioCanonical() {
  redirect('/admin/admin/studio');
}
