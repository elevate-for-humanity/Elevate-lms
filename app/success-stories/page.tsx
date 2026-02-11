export const dynamic = 'force-dynamic';

import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Success Stories | Graduate Testimonials | Elevate for Humanity',
  description: 'Read inspiring stories from our graduates who transformed their careers through apprenticeship training.',
  alternates: { canonical: `${SITE_URL}/success-stories` },
};

export default async function SuccessStoriesPage() {
  const supabase = await createClient();
  
  const { data: stories } = await supabase
    .from('success_stories')
    .select('*')
    .eq('published', true)
    .order('display_order', { ascending: true });

  return (
    <main className="min-h-screen bg-white text-black">
      <section className="bg-blue-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Success Stories</h1>
          <p className="text-xl opacity-90">Real graduates. Real results.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Success Stories' },
          ]}
        />
      </div>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          {stories && stories.length > 0 ? (
            <div className="space-y-8">
              {stories.map((story) => (
                <div key={story.id} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <p className="text-lg text-gray-700 mb-4">"{story.quote}"</p>
                  <p className="font-semibold">{story.name}</p>
                  <p className="text-sm text-gray-500">{story.program}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">Success Stories Coming Soon</h2>
              <p className="text-gray-600 mb-8">Check back soon to read about our graduates.</p>
              <Link href="/programs" className="inline-flex px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                Explore Programs
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
