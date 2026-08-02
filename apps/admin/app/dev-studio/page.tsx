// Canonical Dev Studio route
// Redirects to the actual Dev Studio implementation at /admin/studio
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DevStudioCanonical() {
  redirect('/admin/studio');
}
