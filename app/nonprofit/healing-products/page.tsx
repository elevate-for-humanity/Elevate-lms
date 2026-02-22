import Link from 'next/link';
import { Metadata } from 'next';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Gift, ShoppingBag, Heart, Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Healing Products | Selfish Inc.',
  description: 'Curated products to support your wellness journey.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit/healing-products',
  },
};

export const dynamic = 'force-dynamic';

export default async function HealingProductsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get products
  const { data: products } = await db
    .from('products')
    .select('*')
    .eq('category', 'healing')
    .eq('is_active', true)
    .order('name', { ascending: true });

  // Get product categories
  const { data: categories } = await db
    .from('product_categories')
    .select('*')
    .eq('parent_category', 'healing')
    .eq('is_active', true);

  const defaultProducts = [
    {
      id: 1,
      name: 'Mindfulness Journal',
      description: 'Guided journal for daily reflection and gratitude practice.',
      price: 24.99,
      image_url: null,
    },
    {
      id: 2,
      name: 'Aromatherapy Set',
      description: 'Essential oils for relaxation and stress relief.',
      price: 34.99,
      image_url: null,
    },
    {
      id: 3,
      name: 'Meditation Cushion',
      description: 'Comfortable cushion for your meditation practice.',
      price: 49.99,
      image_url: null,
    },
    {
      id: 4,
      name: 'Self-Care Kit',
      description: 'Curated collection of wellness essentials.',
      price: 59.99,
      image_url: null,
    },
    {
      id: 5,
      name: 'Healing Crystals Set',
      description: 'Collection of crystals for energy and balance.',
      price: 29.99,
      image_url: null,
    },
    {
      id: 6,
      name: 'Wellness Tea Collection',
      description: 'Organic teas for relaxation and wellness.',
      price: 19.99,
      image_url: null,
    },
  ];

  const displayProducts = products && products.length > 0 ? products : defaultProducts;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Healing Products' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-amber-500 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Gift className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Healing Products</h1>
          <p className="text-xl text-amber-100">
            Curated products to support your wellness journey
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/nonprofit" className="text-brand-blue-600 hover:text-brand-blue-700 mb-8 inline-block">
          ← Back to Selfish Inc.
        </Link>

        {/* Mission Statement */}
        <section className="mb-12 bg-amber-50 rounded-xl p-8">
          <Heart className="w-10 h-10 text-amber-600 mb-4" />
          <p className="text-lg text-gray-700">
            All proceeds from our healing products support our nonprofit mission to provide 
            mental wellness services to those in need. When you shop with us, you're 
            supporting both your own wellness journey and our community programs.
          </p>
        </section>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Categories</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category: any) => (
                <button 
                  key={category.id}
                  className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-amber-200 transition"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Products Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProducts.map((product: any) => (
              <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition group">
                <div className="aspect-square bg-amber-50 flex items-center justify-center relative">
                  {product.image_url ? (
                    <Image alt="Healing product" 
                      src={product.image_url} 
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <Gift className="w-16 h-16 text-amber-300" />
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-amber-600 transition">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xl text-amber-600">
                      ${product.price?.toFixed(2)}
                    </span>
                    <button className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">What Customers Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-3">
                "The mindfulness journal has become an essential part of my morning routine. 
                Love knowing my purchase supports such a great cause!"
              </p>
              <div className="font-semibold">Sarah M.</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 italic mb-3">
                "Beautiful products and fast shipping. The self-care kit made a perfect 
                gift for my sister."
              </p>
              <div className="font-semibold">Michael T.</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Shop With Purpose</h3>
          <p className="text-gray-600 mb-6">
            Every purchase supports mental wellness programs in our community.
          </p>
          <Link 
            href="/nonprofit/donations" 
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            Or Make a Direct Donation
          </Link>
        </section>
      </div>
    </div>
  );
}
