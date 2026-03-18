import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Employer Benefits | Elevate for Humanity',
  description: 'Discover the benefits of partnering with Elevate for Humanity.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employers/benefits',
  },
};

export default async function EmployerBenefitsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch benefit content
  const { data: benefits } = await db
    .from('content_blocks')
    .select('*')
    .eq('page', 'employer_benefits');
  return (
    <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Employers", href: "/employers" }, { label: "Benefits" }]} />
      </div>
<div className="bg-brand-blue-700 text-white py-12">
        <div className="container mx-auto px-4">
          <Link
            href="/employers"
            className="inline-flex items-center text-brand-orange-100 hover:text-white mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employers
          </Link>
          <h1 className="text-4xl font-bold mb-4">Employer Benefits</h1>
          <p className="text-xl text-brand-orange-100 max-w-3xl">
            Discover why hundreds of employers trust Elevate for Humanity to
            help them build skilled, reliable workforces.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6">Key Benefits</h2>
            <div className="space-y-6">
              {[
                {
                  title: 'Pre-Screened Talent',
                  description:
                    'All candidates have completed rigorous training and passed industry certifications before you meet them.',
                },
                {
                  title: 'Reduced Hiring Costs',
                  description:
                    'Save time and money on recruitment, screening, and training with our ready-to-work candidates.',
                },
                {
                  title: 'Lower Turnover',
                  description:
                    'Our candidates are committed to their careers and more likely to stay with your company long-term.',
                },
                {
                  title: 'Ongoing Support',
                  description:
                    'We provide continued support to both employers and employees to ensure successful placements.',
                },
                {
                  title: 'Diverse Talent Pool',
                  description:
                    'Access candidates from diverse backgrounds, helping you build an inclusive workforce.',
                },
                {
                  title: 'Industry Partnerships',
                  description:
                    'Benefit from our partnerships with workforce boards, training providers, and industry associations.',
                },
              ].map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-black">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Success Metrics</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-brand-orange-600 mb-2">
                  90%
                </div>
                <p className="text-black">Placement Success Rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-brand-orange-600 mb-2">
                  85%
                </div>
                <p className="text-black">1-Year Retention Rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-brand-orange-600 mb-2">
                  500+
                </div>
                <p className="text-black">Employer Partners</p>
              </div>
            </div>
          </section>

          <section className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Partner With Us?
            </h2>
            <p className="text-black mb-6">
              Join hundreds of employers who have found success through our
              platform.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/employers/post-job">
                <Button size="lg">
                  Post a Job
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Us
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
