import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Success Stories | Elevate for Humanity',
  description:
    'Real outcomes from students who transformed their lives through our training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/success',
  },
};

export default async function SuccessStoriesPage() {
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
  
  // Fetch success stories
  const { data: stories } = await db
    .from('success_stories')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  return (
    <div className="min-h-screen">
      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[60vh] min-h-[400px] max-h-[720px] w-full overflow-hidden">
          <Image src="/images/pages/success-page-1.jpg" alt="Success Stories" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Success Stories</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Real outcomes from students who transformed their lives through workforce training.</p>
          </div>
        </div>
      </section>

      {/* Real Training Images */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-64">
                <Image
                  src="/images/pages/success-page-1.jpg"
                  alt="Student success at Elevate for Humanity"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Healthcare Careers</h3>
                <p className="text-black mb-4">
                  CNA, Medical Assistant, and Home Health Aide graduates now
                  working in hospitals and clinics across Indiana.
                </p>
                <Link href="/programs/healthcare" className="text-brand-orange-600 font-semibold hover:underline">
                  View Programs →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-64">
                <Image
                  src="/images/pages/success-page-1.jpg"
                  alt="Barber Training"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Skilled Trades</h3>
                <p className="text-black mb-4">
                  Barber, HVAC, and Building Maintenance graduates earning
                  $40K-$60K annually.
                </p>
                <Link href="/programs/skilled-trades" className="text-brand-orange-600 font-semibold hover:underline">
                  View Programs →
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-64">
                <Image
                  src="/images/pages/success-page-1.jpg"
                  alt="Business Training"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Business & Tech</h3>
                <p className="text-black mb-4">
                  Entrepreneurs and tech professionals building successful
                  careers and businesses.
                </p>
                <Link href="/programs/business" className="text-brand-orange-600 font-semibold hover:underline">
                  View Programs →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Our Impact by the Numbers
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2">
                5,000+
              </div>
              <p className="text-black">Students Trained</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2">85%</div>
              <p className="text-black">Job Placement Rate</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2">
                $45K
              </div>
              <p className="text-black">Average Starting Salary</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2">90%</div>
              <p className="text-black">Student Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Write Your Success Story?
          </h2>
          <p className="text-xl text-brand-orange-100 mb-8 max-w-2xl mx-auto">
            Students across Indiana have transformed their lives through
            our training programs.
          </p>
          <Link href="/apply">
            <Button size="lg" variant="secondary">
              Apply Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
