/**
 * AdminClientPage — server-side auth gate for client-heavy admin pages.
 *
 * Usage:
 *   // app/admin/some-page/page.tsx  (server component — no 'use client')
 *   import AdminClientPage from '@/components/admin/AdminClientPage';
 *   import SomePageClient from './SomePageClient';
 *
 *   export default function SomePage() {
 *     return <AdminClientPage><SomePageClient /></AdminClientPage>;
 *   }
 *
 * This component runs requireAdmin() on the server before the client
 * component is ever sent to the browser. Unauthorized users are redirected
 * at the route boundary — the client component never renders.
 */
import { requireAdmin } from '@/lib/auth';

interface AdminClientPageProps {
  children: React.ReactNode;
}

export default async function AdminClientPage({ children }: AdminClientPageProps) {
  await requireAdmin();
  return <>{children}</>;
}
