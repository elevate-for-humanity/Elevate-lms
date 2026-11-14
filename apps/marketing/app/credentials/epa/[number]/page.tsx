import { notFound } from 'next/navigation';
import { nativeCertificate } from '@/lib/testing/native-certificate';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'EPA Credential Verification | Elevate',
  robots: { index: false, follow: false },
};
export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const c = await nativeCertificate(number);
  if (!c) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">EPA 608 credential verified</h1>
      <dl className="mt-6 space-y-4 rounded-xl border p-6">
        <div>
          <dt>Technician</dt>
          <dd className="font-bold">{c.candidate_name}</dd>
        </div>
        <div>
          <dt>Certification type</dt>
          <dd>{c.exam_type.replaceAll('_', ' ')}</dd>
        </div>
        <div>
          <dt>Issued by</dt>
          <dd>{c.issuer}</dd>
        </div>
        <div>
          <dt>Certificate number</dt>
          <dd className="break-all">{c.certificate_number}</dd>
        </div>
        <div>
          <dt>Issue date</dt>
          <dd>{c.certificate_issued_at.slice(0, 10)}</dd>
        </div>
      </dl>
    </main>
  );
}
