import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { OfferingBadge } from '@/components/ui/OfferingBadge';
import { getOfferingKind, offeringCTA, offeringSubLabel } from '@/lib/offering-labels';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/courses/partners' },
  title: 'Short-Term Courses | Elevate For Humanity',
  description: 'Direct-purchase short-term courses from NRF, CareerSafe, HSI, and other industry partners.',
};

export default async function PartnerCoursesPage() {
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from('partner_lms_providers')
    .select('*')
    .eq('is_active', true)
    .order('provider_name');

  const { data: courses, count } = await supabase
    .from('partner_lms_courses')
    .select('*, partner_lms_providers(provider_name, provider_type)', { count: 'exact' })
    .eq('is_active', true)
    .order('course_name');

  const coursesByPartner = courses?.reduce(
    (acc: Record<string, any>, course: Record<string, any>) => {
      const name = course.partner_lms_providers?.provider_name || 'Other';
      if (!acc[name]) acc[name] = [];
      acc[name].push(course);
      return acc;
    }, {}
  ) || {};

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Courses', href: '/courses' }, { label: 'Short-Term Courses' }]} />

      {/* Hero — image only, text below */}
      <section className="relative w-full">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <Image src="/images/pages/about-partner-cta.jpg" alt="Short-term courses" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-white border-t py-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">Short-Term Courses</h1>
          <p className="text-black text-lg max-w-2xl mx-auto mb-6">
            Direct-purchase courses from industry partners. Enroll today — no funding application required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="bg-slate-100 px-6 py-3 rounded-lg">
              <span className="text-3xl font-bold text-black">{count ?? 0}</span>
              <span className="text-sm text-black ml-2">Courses Available</span>
            </div>
            <div className="bg-slate-100 px-6 py-3 rounded-lg">
              <span className="text-3xl font-bold text-black">{providers?.length ?? 0}</span>
              <span className="text-sm text-black ml-2">Course Providers</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Provider grid */}
        {providers && providers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-black mb-6">Course Providers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {providers.map((p: Record<string, any>) => (
                <div key={p.id} className="bg-white rounded-lg shadow-sm border p-4 text-center">
                  <div className="font-semibold text-sm text-black mb-1">{p.provider_name}</div>
                  <OfferingBadge kind={getOfferingKind(p.provider_type)} />
                  <div className="text-xs text-black mt-1">{coursesByPartner[p.provider_name]?.length ?? 0} courses</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses by provider */}
        {Object.entries(coursesByPartner).map(([partnerName, partnerCourses]: [string, any]) => {
          const kind = getOfferingKind(partnerCourses[0]?.partner_lms_providers?.provider_type);
          const cta = offeringCTA(kind);
          const sub = offeringSubLabel(kind);
          return (
            <div key={partnerName} className="mb-12">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <h2 className="text-2xl font-bold text-black">{partnerName}</h2>
                <OfferingBadge kind={kind} />
                <span className="text-sm text-black ml-auto">{partnerCourses.length} courses</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partnerCourses.slice(0, 6).map((course: Record<string, any>) => (
                  <div key={course.id} className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">{course.course_name}</h3>
                      {course.description && (
                        <p className="text-sm text-black mb-4 line-clamp-3 flex-1">{course.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm mb-3">
                        {course.duration_hours && <span className="text-black">{course.duration_hours} hours</span>}
                        {course.retail_price && <span className="font-bold text-black">${course.retail_price}</span>}
                      </div>
                      {course.category && (
                        <div className="mb-4">
                          <span className="px-2 py-1 bg-slate-100 text-black rounded text-xs font-medium">{course.category}</span>
                        </div>
                      )}
                      <Link href={`/courses/partners/${course.id}/enroll`} className="block w-full text-center px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors font-semibold">
                        {cta}
                      </Link>
                      <p className="text-xs text-black text-center mt-2">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              {partnerCourses.length > 6 && (
                <div className="mt-6 text-center">
                  <button className="px-6 py-2 border border-black text-black rounded-lg hover:bg-slate-50 font-semibold">
                    View All {partnerCourses.length} {partnerName} Courses
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {(!courses || courses.length === 0) && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <h3 className="text-lg font-semibold text-black mb-2">No Courses Available Yet</h3>
            <p className="text-black">Short-term courses will appear here once loaded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
