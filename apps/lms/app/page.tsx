import { redirect } from 'next/navigation';

export default function LMSRootPage() {
  // Bare LMS root must never depend on Supabase, cookies, or another runtime
  // service. The config-level redirect handles the normal request path; this
  // page is the dependency-free fallback if routing reaches the app layer.
  redirect('/login');
}
