import { notFound, redirect } from 'next/navigation';
import { loadMyDigitalWorkbook, loadMyDigitalWorkbooks } from '@/lib/lms/digital-workbooks';
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
  const result = await loadMyDigitalWorkbook(slug);
  if (!result) {
    const { user } = await loadMyDigitalWorkbooks();
    if (!user) redirect(`/login?redirect=${encodeURIComponent(`/workbooks/${slug}`)}`);
    notFound();
  }
  return <DigitalWorkbook key={result.accountId} {...result} />;
}
