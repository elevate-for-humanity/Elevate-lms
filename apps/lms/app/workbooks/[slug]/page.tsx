import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loadMyDigitalWorkbook } from '@/lib/lms/digital-workbooks';
import DigitalWorkbook from '@/components/lms/DigitalWorkbook';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Digital Workbook | Elevate for Humanity',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function DigitalWorkbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/workbooks/${slug}`)}`);
  const result = await loadMyDigitalWorkbook(slug);
  if (!result) notFound();
  return <DigitalWorkbook key={result.accountId} {...result} />;
}
