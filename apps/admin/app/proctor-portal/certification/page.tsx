import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import CertificationConsole from './CertificationConsole';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Certification Operations | Elevate',
  robots: { index: false, follow: false },
};
export default async function Page() {
  await requireRole(['admin', 'super_admin', 'proctor', 'test_admin', 'staff']);
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/proctor-portal" className="font-bold text-blue-700 underline">
        Exam sessions
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Certification operations</h1>
      <CertificationConsole />
    </main>
  );
}
