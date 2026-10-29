import Image from 'next/image';
import Link from 'next/link';
import { workbookProducts } from '@/lib/store/workbook-products';

export const metadata = {
  title: 'Apprenticeship Workbooks | Elevate Store',
  description:
    'Barbering, cosmetology, esthetics and nail technology apprenticeship workbooks. Save your practice answers to your account.',
};
export default function WorkbookStorePage() {
  return (
    <main className="bg-stone-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <p className="font-bold uppercase tracking-widest text-brand-red-700">
          Elevate for Humanity
        </p>
        <h1 className="mt-3 text-4xl font-black">Apprenticeship workbooks</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed">
          Open a guided digital workbook with one activity per screen. Listen with PARIS, pause to
          write, move back and forward, and save your answers to your account so you can continue on
          another device.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed">
          $90 per workbook, one-time purchase. Access opens after payment is verified. Workbook
          purchase does not include course enrollment, training hours, instructor sign-off, or a
          license.
        </p>
        <Link className="my-6 inline-block min-h-11 py-3 font-bold underline" href="/store/orders">
          Already purchased? Open My Purchases
        </Link>
        <div className="grid gap-6 sm:grid-cols-2">
          {workbookProducts.map((book) => (
            <article
              key={book.id}
              className="overflow-hidden rounded-2xl border border-slate-300 bg-white"
            >
              <div className="relative h-64">
                <Image
                  src={book.image}
                  alt={`${book.subject} training`}
                  fill
                  sizes="(max-width: 640px) 100vw, 550px"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <p className="font-semibold">{book.sections} sections · Digital workbook</p>
                <h2 className="mt-2 text-2xl font-bold">{book.name}</h2>
                <p className="mt-3 leading-relaxed">{book.description}</p>
                <p className="mt-4 text-2xl font-black">$90</p>
                <Link
                  className="mt-4 inline-flex min-h-12 items-center rounded-lg bg-slate-900 px-5 py-3 font-bold text-white"
                  href={`/store/cart?add=${book.slug}`}
                >
                  Add {book.subject.toLowerCase()} workbook to cart
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
