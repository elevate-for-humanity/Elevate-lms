import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Settings } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import PageAvatar from '@/components/PageAvatar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/hsi',
  },
  title: 'HSI Safety Training Courses | Elevate For Humanity',
  description:
    'Access 1,200+ OSHA-compliant safety training courses through our HSI partnership. Funded for eligible students.',
};

export default async function HsiPage() {
  const supabase = await createClient();

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
  
  // Fetch HSI courses
  const { data: hsiCourses } = await supabase
    .from('courses')
    .select('*')
    .eq('provider', 'hsi');
  const courseCategories = [
    {
      name: 'OSHA Safety',
      count: 450,
      icon: '🦺',
      description: 'OSHA 10, OSHA 30, and compliance training',
    },
    {
      name: 'First Aid & CPR',
      count: 120,
      icon: '🏥',
      description: 'Emergency response and medical training',
    },
    {
      name: 'Construction Safety',
      count: 280,
      icon: '🏗️',
      description: 'Fall protection, scaffolding, and equipment safety',
    },
    {
      name: 'Industrial Safety',
      count: 200,
      icon: '<Settings className="w-5 h-5 inline-block" />',
      description: 'Manufacturing, warehouse, and industrial safety',
    },
    {
      name: 'Environmental Safety',
      count: 100,
      icon: '🌍',
      description: 'Hazmat, spill response, and environmental compliance',
    },
    {
      name: 'Healthcare Safety',
      count: 50,
      icon: '⚕️',
      description: 'Bloodborne pathogens, infection control, patient safety',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'HSI Safety Training' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[380px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs-hq/skilled-trades-hero.jpg"
          alt="HSI Safety Training"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-semibold">Powered by HSI</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            HSI Safety Training Courses
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg max-w-2xl mx-auto">
            Access 1,200+ OSHA-compliant safety training courses. CPR, First Aid, and workplace safety certifications - Funded through WIOA funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs/cpr-first-aid-hsi"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get CPR Certified
            </Link>
            <Link
              href="/courses/catalog"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Browse All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/healthcare-guide.mp4" 
        title="HSI Safety Training Guide" 
      />

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                1,200+
              </div>
              <div className="text-black">Safety Courses</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                100%
              </div>
              <div className="text-black">OSHA Compliant</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                24/7
              </div>
              <div className="text-black">Online Access</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
                Free
              </div>
              <div className="text-black">WIOA Funded</div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Course Categories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courseCategories.map((category) => (
                <Link
                  key={category.name}
                  href="/programs/cpr-first-aid-hsi"
                  className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow p-6 group"
                >
                  <div className="text-4xl mb-4 text-2xl md:text-3xl lg:text-4xl">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2 group-hover:text-brand-orange-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-black text-sm mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-black">
                      {category.count} courses
                    </span>
                    <span className="text-brand-orange-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Explore →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Why Choose HSI Training?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-brand-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">OSHA Compliant</h3>
                <p className="text-black">
                  All courses meet or exceed OSHA standards and requirements
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-brand-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Self-Paced</h3>
                <p className="text-black">
                  Learn at your own pace with 24/7 online access
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-brand-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Certificates</h3>
                <p className="text-black">
                  Receive industry-standard-recognized certificates upon
                  completion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16    text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Certified?
            </h2>
            <p className="text-base md:text-lg text-red-100 mb-8">
              Start your safety training today. All courses are Funded
              through WIOA funding.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-white text-brand-orange-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-50 transition-colors"
            >
              Apply Now - It's Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
