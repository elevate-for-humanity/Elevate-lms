import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LMSRootPage() {
  // Keep the service root deterministic and dependency-free. The login flow
  // resolves the authenticated user's authoritative portal after sign-in.
  redirect('/login');
}
