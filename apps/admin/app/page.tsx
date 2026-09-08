export const metadata = { robots: { index: false } };

import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Desktop and installed Admin PWA share one canonical operating entry.
  redirect('/studio/browser');
}
