import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import GrokSettingsClient from './GrokSettingsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Provider Keys | Elevate Admin',
  robots: { index: false, follow: false },
};

export default async function GrokSettingsPage() {
  await requireAdmin();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <GrokSettingsClient />
    </main>
  );
}
