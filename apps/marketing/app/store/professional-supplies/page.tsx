import Link from 'next/link';
import Image from 'next/image';
import { getProducts } from '@/lib/store/db';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Professional Apprenticeship Supplies | Elevate',
  description: 'Shop available professional training supplies and apprenticeship equipment through Elevate.',
};

const collections = [
  { name: 'Barbering', term: 'barber', description: 'Clippers, trimmers, cutting tools and barber essentials.' },
  { name: 'Cosmetology', term: 'cosmetology', description: 'Styling equipment and hands-on training essentials.' },
  { name: 'Nail Technology', term: 'nail', description: 'Manicure tools and nail technician supplies.' },
  { name: 'Esthetics', term: 'esthetic', description: 'Skin-care training and treatment accessories.' },
  { name: 'HVAC & Trades', term: 'hvac', description: 'Tools and practical equipment for skilled trades.' },
];

export default async function ProfessionalSuppliesPage() {
  const products = await getProducts({ limit: 300 });
  const physical = products.filter((product) => product.requires_shipping && product.is_active);
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-5 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Elevate Professional Marketplace</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Tools for the trade. Supplies for the journey.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">Explore apprenticeship equipment and professional supplies alongside Elevate's training programs.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/store/cart" className="rounded-lg bg-white px-6 py-3 font-bold text-slate-950">View cart</Link>
            <Link href="/store/courses" className="rounded-lg border border-white/50 px-6 py-3 font-bold text-white">Explore courses</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-3xl font-black">Shop by profession</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <a key={collection.term} href={`#collection-${collection.term}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-slate-500">
              <h3 className="text-xl font-bold">{collection.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{collection.description}</p>
            </a>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-20">
        {collections.map((collection) => {
          const matches = physical.filter((product) =>
            [product.category, product.name, product.description, ...(product.tags || [])].join(' ').toLowerCase().includes(collection.term),
          );
          return (
            <div id={`collection-${collection.term}`} key={collection.term} className="scroll-mt-20 border-t border-slate-200 py-10">
              <h2 className="text-2xl font-black">{collection.name}</h2>
              {matches.length ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {matches.map((product) => (
                    <Link href={`/store/products/${encodeURIComponent(product.slug)}`} key={product.id} className="overflow-hidden rounded-xl border border-slate-200 hover:shadow-lg">
                      <div className="relative aspect-square bg-slate-100">
                        {product.image_url ? <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-contain" unoptimized /> : <div className="flex h-full items-center justify-center text-sm text-slate-500">Image pending</div>}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="mt-2 font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.price_cents ? product.price_cents / 100 : product.price)}</p>
                        <span className="mt-3 inline-block text-sm font-bold underline">View product</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : <p className="mt-4 rounded-xl bg-slate-50 p-5 text-slate-600">No verified products are currently available in this collection.</p>}
            </div>
          );
        })}
      </section>
    </main>
  );
}
