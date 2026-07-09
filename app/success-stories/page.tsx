export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
import { SuccessStories } from '@/components/marketing/SuccessStories';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Success Stories | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Real stories from graduates who transformed their careers through our workforce training programs.',
};

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Success Stories</h1>
          <p className="text-xl text-blue-100">
            Real people. Real transformations. Real career outcomes.
          </p>
        </div>
      </section>
      
      {/* Real Component */}
      <SuccessStories />
    </div>
  );
}

