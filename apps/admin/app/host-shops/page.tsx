import { redirect } from 'next/navigation';

/** Backward-compatible route for old Admin dashboard links and bookmarks. */
export default function HostShopsCompatibilityPage() {
  redirect('/partners');
}
