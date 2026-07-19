export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Press | Elevate for Humanity',
  description: 'Press page content.',
};

export default async function PressPage() {
  const db = await requireAdminClient();

  // Press-specific posts (category = 'press' or 'media')
  const { data: pressItems } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at, category')
    .eq('published', true)
    .in('category', ['press', 'media', 'Press', 'Media'])
    .order('published_at', { ascending: false })
    .limit(12);

  // Recent news as fallback if no press-tagged posts
  const { data: recentNews } = await db
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image, published_at, category')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(6);

  const posts = pressItems && pressItems.length > 0 ? pressItems : (recentNews ?? []);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Press</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
