import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadMyDigitalWorkbooks } from '@/lib/lms/digital-workbooks';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'My Workbooks | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function WorkbooksPage() {
  const { user, workbooks } = await loadMyDigitalWorkbooks();
  if (!user) redirect('/login?redirect=/workbooks');
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/lms" className="inline-block py-3 underline">
          My learning dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold">My Workbooks</h1>
        <p className="my-5 max-w-prose text-lg leading-relaxed">
          Open your assigned apprenticeship workbook. Type your answers and save them to your
          account so you can continue on another device.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          {workbooks.map((book) => (
            <article
              key={book.id}
              className="overflow-hidden rounded-xl border border-slate-300 bg-white"
            >
              <div className="relative h-64 bg-slate-900">
                <Image
                  src={book.cover_image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 450px"
                  className="object-contain"
                />
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold">
                  Elevate for Humanity · Apprenticeship program
                </p>
                <h2 className="my-3 text-xl font-bold leading-relaxed">{book.title}</h2>
                <Link
                  href={`/workbooks/${book.slug}`}
                  className="inline-block min-h-12 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white"
                >
                  Open workbook
                </Link>
              </div>
            </article>
          ))}
        </div>
        {!workbooks.length && (
          <p className="rounded-lg border border-slate-300 p-5 leading-relaxed">
            No digital workbook is assigned to an active program enrollment yet. Contact your
            instructor if you expected access.
          </p>
        )}
        <Link href="/lms/support" className="mt-8 inline-block py-3 underline">
          Get help
        </Link>
      </div>
    </main>
  );
}
