import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Meet the Founder | Selfish Inc.',
  description: 'Learn about the founder of Selfish Inc. and Rise Forward Foundation',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/nonprofit/meet-the-founder',
  },
};

export default async function MeetTheFounderPage() {
  const supabase = await createClient();
  const db = await getAdminClient();

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
  
  // Fetch founder info
  const { data: founder } = await db
    .from('team_members')
    .select('*')
    .eq('role', 'founder')
    .single();
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Meet the Founder' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/nonprofit" className="text-brand-blue-600 hover:text-brand-blue-700 mb-8 inline-block">
          ← Back to Selfish Inc.
        </Link>

        <h1 className="text-4xl font-bold text-black mb-6">Meet the Founder</h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-black mb-8">
            Learn about the vision and mission behind Selfish Inc. and Rise Forward Foundation.
          </p>

          <h2 className="text-2xl font-bold text-black mt-8 mb-4">Our Mission</h2>
          <p className="text-black mb-4">
            Selfish Inc., doing business as Rise Forward Foundation, is dedicated to providing
            mental wellness and holistic healing support to individuals and communities.
          </p>

          <h2 className="text-2xl font-bold text-black mt-8 mb-4">Our Vision</h2>
          <p className="text-black mb-4">
            We envision a world where everyone has access to the mental health and wellness
            resources they need to thrive.
          </p>

          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-black mb-3">Get Involved</h3>
            <p className="text-black mb-4">
              Join us in our mission to support mental wellness and holistic healing.
            </p>
            <Link href="/rise-foundation/get-involved" className="inline-block bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 transition">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
