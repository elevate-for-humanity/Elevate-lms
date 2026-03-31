import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag,
  Phone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ShopClient } from './ShopClient';
import { PageTracker } from '@/components/analytics/PageTracker';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop | Elevate for Humanity',
  description: 'Shop professional tools, equipment, apparel, and study materials for your career training programs. Quality gear at student-friendly prices.',
  keywords: ['shop', 'tools', 'equipment', 'scrubs', 'study guides', 'career training', 'student supplies'],
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
  openGraph: {
    title: 'Shop | Elevate for Humanity',
    description: 'Shop professional tools, equipment, apparel, and study materials for your career training programs.',
    url: `${SITE_URL}/shop`,
    siteName: 'Elevate for Humanity',
    type: 'website',
    images: [{ url: `${SITE_URL}/images/og/shop-og.jpg`, width: 1200, height: 630, alt: 'Elevate Shop' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop | Elevate for Humanity',
    description: 'Shop professional tools, equipment, and study materials for your career training.',
  },
};

const categories = ['All', 'Tools', 'Apparel', 'Books', 'Safety', 'Accessories'];

export default async function ShopPage() {
  let products: any[] = [];
  
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('shop_products')
        .select('id, name, slug, price, rating, review_count, category, image_url')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);
      
      products = data || [];
    }
  } catch (err) {
    logger.error('Failed to fetch shop products:', err);
  }

  return (
    <div className="min-h-screen bg-white">
      <PageTracker pageName="Shop" pageCategory="ecommerce" />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop' }]} />
        </div>
      </div>

      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/shop-hero.jpg"
          alt="Shop"
          fill
          className="object-cover"
          priority
         sizes="100vw" />
      </div>

      <ShopClient products={products} categories={categories} />
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
