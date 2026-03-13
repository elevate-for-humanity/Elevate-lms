import { Metadata } from 'next';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

import ReelsFeed from '@/components/reels/ReelsFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reels | Elevate For Humanity',
  description:
    'Watch short-form videos about career training and success stories',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/reels',
  },
};

async function getReels() {
  try {
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
    const { data }: any = await db
      .from('reels')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20);
    return data || [];
  } catch (error) { /* Error handled silently */ 
    return [];
  }
}

export default async function ReelsPage() {
  const reels = await getReels();

  return (
    <div className="bg-gray-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Reels" }]} />
      </div>
<ReelsFeed reels={reels} />
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Get Help Online
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
