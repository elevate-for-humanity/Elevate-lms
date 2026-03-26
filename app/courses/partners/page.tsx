import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/partners',
  },
  title: 'Partner Course Catalog | Elevate For Humanity',
  description:
    '1200+ professional courses from industry-standard-leading partners',
};

export default async function PartnerCoursesPage() {
  const supabase = await createClient();


  // Fetch all partner providers
  const { data: providers } = await supabase
    .from('partner_lms_providers')
    .select('*')
    .eq('is_active', true)
    .order('provider_name');

  // Fetch all partner courses
  const { data: courses, count } = await supabase
    .from('partner_lms_courses')
    .select('*, partner_lms_providers(provider_name, provider_type)', {
      count: 'exact',
    })
    .eq('is_active', true)
    .order('course_name');

  // Group courses by partner
  const coursesByPartner =
    courses?.reduce(
      (acc: Record<string, any>, course: Record<string, any>) => {
        const partnerName =
          course.partner_lms_providers?.provider_name || 'Other';
        if (!acc[partnerName]) {
          acc[partnerName] = [];
        }
        acc[partnerName].push(course);
        return acc;
      },
      {}
    ) || {};

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'Partner Courses' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/about-partner-cta.jpg"
          alt="Partners"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-3xl md:text-4xl lg:text-5xl">
              Partner Course Catalog
            </h1>
            <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Access 1200+ professional courses from industry-standard-leading
              partners
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="bg-white px-6 py-3 rounded-lg">
                <span className="text-3xl font-bold">{count || 0}</span>
                <span className="text-sm ml-2">Courses Available</span>
              </div>
              <div className="bg-white px-6 py-3 rounded-lg">
                <span className="text-3xl font-bold">
                  {providers?.length || 0}
                </span>
                <span className="text-sm ml-2">Partner Providers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Partner Providers */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Our Partners
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {providers?.map((provider: Record<string, any>) => (
                <div
                  key={provider.id}
                  className="bg-white rounded-lg shadow-sm border p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="font-semibold text-sm">
                    {provider.provider_name}
                  </div>
                  <div className="text-xs text-black mt-1">
                    {coursesByPartner[provider.provider_name]?.length || 0}{' '}
                    courses
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses by Partner */}
          {Object.entries(coursesByPartner).map(
            ([partnerName, partnerCourses]: [string, any]) => (
              <div key={partnerName} className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{partnerName}</h2>
                  <span className="text-sm text-black">
                    {partnerCourses.length} courses
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partnerCourses
                    .slice(0, 6)
                    .map((course: Record<string, any>) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                            {course.course_name}
                          </h3>
                          {course.description && (
                            <p className="text-sm text-black mb-4 line-clamp-3">
                              {course.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm mb-4">
                            {course.duration_hours && (
                              <span className="text-black">
                                {course.duration_hours} hours
                              </span>
                            )}
                            {course.retail_price && (
                              <span className="font-semibold text-brand-green-600">
                                ${course.retail_price}
                              </span>
                            )}
                          </div>

                          {course.category && (
                            <div className="mb-4">
                              <span className="px-2 py-2 bg-brand-blue-100 text-brand-blue-700 rounded text-xs">
                                {course.category}
                              </span>
                            </div>
                          )}

                          <Link
                            href={`/courses/partners/${course.id}/enroll`}
                            className="block w-full text-center px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
                          >
                            Enroll Now
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>

                {partnerCourses.length > 6 && (
                  <div className="mt-6 text-center">
                    <button className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200" aria-label="Action button">
                      View All {partnerCourses.length} {partnerName} Courses
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Empty State */}
          {(!courses || courses.length === 0) && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <svg
                className="w-16 h-16 text-black mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-semibold text-black mb-2">
                No Partner Courses Available
              </h3>
              <p className="text-black">
                Partner courses will appear here once they are loaded into the
                system.
              </p>
            </div>
          )}
        </div>

        {/* Storytelling Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] rounded-2xl overflow-hidden border-4 border-gray-200">
                  <Image
                    src="/images/pages/accreditation.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
