import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Search, Filter, Star, Users, Clock, ChevronRight,
  Phone
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Marketplace | Elevate for Humanity',
  description: 'Discover courses from expert creators. Browse our marketplace of professional training courses in trades, healthcare, technology, and more.',
  keywords: ['course marketplace', 'online courses', 'professional training', 'skill development', 'career courses'],
  alternates: {
    canonical: `${SITE_URL}/marketplace`,
  },
  openGraph: {
    title: 'Course Marketplace | Elevate for Humanity',
    description: 'Discover courses from expert creators. Browse professional training courses in trades, healthcare, technology, and more.',
    url: `${SITE_URL}/marketplace`,
    siteName: 'Elevate for Humanity',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/og/marketplace-og.jpg`,
        width: 1200,
        height: 630,
        alt: 'Elevate Course Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Course Marketplace | Elevate for Humanity',
    description: 'Discover courses from expert creators in trades, healthcare, technology, and more.',
  },
};

const categories = ['All', 'Trades', 'Healthcare', 'Technology', 'Business', 'Creative'];

export default async function MarketplacePage() {
  let courses: any[] = [];
  
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (supabase) {
      const { data } = await db
        .from('marketplace_courses')
        .select('id, title, slug, creator_name, price, rating, student_count, duration_hours, image_url, category')
        .eq('is_published', true)
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('student_count', { ascending: false })
        .limit(12);
      
      if (data && data.length > 0) {
        courses = data;
      }
    }
  } catch {
    // Use fallback courses
  }

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace" }]} />
      </div>
<div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/marketplace-page-2.jpg"
          alt="Marketplace"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8" data-tour="marketplace-filters">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link 
                key={cat}
                href={cat === 'All' ? '/marketplace' : `/marketplace?category=${cat.toLowerCase()}`}
                className={`px-4 py-2 rounded-lg text-sm ${cat === 'All' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-white'}`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Link 
              key={course.id} 
              href={`/marketplace/course/${course.slug || course.id}`} 
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              data-tour={index === 0 ? "marketplace-course" : undefined}
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={course.image_url || '/images/pages/comp-home-pathways-support.jpg'}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <span className="text-xs text-indigo-600 font-medium">{course.category}</span>
                <h2 className="font-semibold text-gray-900 text-lg mb-1">{course.title}</h2>
                <p className="text-sm text-gray-500 mb-3">by {course.creator_name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /> {course.rating}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.student_count?.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration_hours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">${course.price}</span>
                  <span className="text-indigo-600 flex items-center gap-1 text-sm font-medium">
                    View <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      {/* CTA Section */}
      <section className="bg-white text-white py-12">
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
    </div>
  );
}
