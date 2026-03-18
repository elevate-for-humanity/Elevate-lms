import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Hammer, Users, Award, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Urban Build Crew | Elevate for Humanity',
  description: 'Construction and skilled trades training for urban communities. Build skills, build careers, build communities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/urban-build-crew',
  },
};

export default function UrbanBuildCrewPage() {
  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Urban Build Crew' },
        ]}
      />
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image src="/images/pages/urban-build-crew-page-1.jpg" alt="Urban Build Crew" fill className="object-cover" priority sizes="100vw" />
      </section>
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Programs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-brand-orange-50 rounded-xl p-6">
              <Hammer className="w-10 h-10 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Construction Fundamentals</h3>
              <p className="text-gray-600 mb-4">Learn basic construction skills including framing, drywall, and finishing.</p>
              <Link href="/programs/skilled-trades" className="text-brand-orange-600 font-medium">Learn More →</Link>
            </div>
            <div className="bg-brand-orange-50 rounded-xl p-6">
              <Users className="w-10 h-10 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Apprenticeship Prep</h3>
              <p className="text-gray-600 mb-4">Prepare for union apprenticeships in various construction trades.</p>
              <Link href="/apprenticeships" className="text-brand-orange-600 font-medium">Learn More →</Link>
            </div>
            <div className="bg-brand-orange-50 rounded-xl p-6">
              <Award className="w-10 h-10 text-brand-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">OSHA Certification</h3>
              <p className="text-gray-600 mb-4">Get OSHA 10 and OSHA 30 safety certifications required for job sites.</p>
              <Link href="/certifications" className="text-brand-orange-600 font-medium">Learn More →</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Build Your Future?</h2>
          <Link href="/start" className="bg-white hover:bg-white text-brand-orange-600 px-8 py-4 rounded-lg text-lg font-bold transition inline-flex items-center">
            Apply Now <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
