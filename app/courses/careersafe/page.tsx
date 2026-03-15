import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Clock, Award } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/careersafe',
  },
  title: 'CareerSafe OSHA Training Courses | Elevate For Humanity',
  description:
    'Access OSHA-authorized safety training courses through our CareerSafe partnership. OSHA 10, OSHA 30, and specialized safety certifications.',
};

export default async function CareerSafePage() {
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
  
  // Fetch CareerSafe courses
  const { data: courses } = await db
    .from('training_courses')
    .select('*')
    .eq('provider', 'careersafe');
  const courseCategories = [
    {
      name: 'OSHA 10-Hour',
      courses: [
        {
          id: 'osha10-general',
          title: 'OSHA 10-Hour General Industry',
          duration: '10 hours',
          price: 'Included',
          description:
            'OSHA-authorized 10-hour general industry safety training',
          certificate: 'OSHA 10-Hour Card',
          enrollUrl:
            'https://www.careersafeonline.com/osha-10-hour-general-industry',
        },
        {
          id: 'osha10-construction',
          title: 'OSHA 10-Hour Construction',
          duration: '10 hours',
          price: 'Included',
          description: 'OSHA-authorized 10-hour construction safety training',
          certificate: 'OSHA 10-Hour Card',
          enrollUrl:
            'https://www.careersafeonline.com/osha-10-hour-construction',
        },
      ],
    },
    {
      name: 'OSHA 30-Hour',
      courses: [
        {
          id: 'osha30-general',
          title: 'OSHA 30-Hour General Industry',
          duration: '30 hours',
          price: 'Included',
          description:
            'Advanced OSHA safety training for supervisors and managers',
          certificate: 'OSHA 30-Hour Card',
          enrollUrl:
            'https://www.careersafeonline.com/osha-30-hour-general-industry',
        },
        {
          id: 'osha30-construction',
          title: 'OSHA 30-Hour Construction',
          duration: '30 hours',
          price: 'Included',
          description: 'Advanced construction safety training for supervisors',
          certificate: 'OSHA 30-Hour Card',
          enrollUrl:
            'https://www.careersafeonline.com/osha-30-hour-construction',
        },
      ],
    },
    {
      name: 'Healthcare Safety',
      courses: [
        {
          id: 'bloodborne-pathogens',
          title: 'Bloodborne Pathogens Training',
          duration: '1 hour',
          price: 'Included',
          description:
            'OSHA-compliant bloodborne pathogens training for healthcare workers',
          certificate: 'Bloodborne Pathogens Certificate',
          enrollUrl: 'https://www.careersafeonline.com/bloodborne-pathogens',
        },
        {
          id: 'infection-control',
          title: 'Infection Control & Prevention',
          duration: '2 hours',
          price: 'Included',
          description: 'Healthcare infection control and prevention training',
          certificate: 'Infection Control Certificate',
          enrollUrl: 'https://www.careersafeonline.com/infection-control',
        },
        {
          id: 'patient-safety',
          title: 'Patient Safety & Care',
          duration: '2 hours',
          price: 'Included',
          description:
            'Essential patient safety training for healthcare workers',
          certificate: 'Patient Safety Certificate',
          enrollUrl: 'https://www.careersafeonline.com/patient-safety',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'CareerSafe OSHA Training' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/courses-page-4.jpg"
          alt="CareerSafe OSHA Training"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why CareerSafe Training?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">OSHA-Authorized</h3>
              <p className="text-black">
                Official OSHA training provider with nationally recognized
                certifications
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-500 flex-shrink-0">•</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Funded</h3>
              <p className="text-black">
                Included with your program enrollment through WIOA or WRG
                funding
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Self-Paced</h3>
              <p className="text-black">
                Complete training on your schedule with 24/7 online access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Available Courses
          </h2>

          {courseCategories.map((category) => (
            <div key={category.name} className="mb-12">
              <h3 className="text-lg md:text-lg font-bold mb-6 text-brand-blue-900">
                {category.name}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {category.courses.map((course: any) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="text-xl font-semibold mb-2">
                      {course.title}
                    </h4>
                    <p className="text-black mb-4">{course.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-black">
                        <Clock className="w-4 h-4" />
                        <span>Duration: {course.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-black">
                        <Award className="w-4 h-4" />
                        <span>Certificate: {course.certificate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-brand-green-600">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                        <span>{course.price}</span>
                      </div>
                    </div>

                    <Link
                      href={course.enrollUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Enroll Now
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Programs Using CareerSafe */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Programs Including CareerSafe Training
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/programs/electrical"
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">HVAC Technician</h3>
              <p className="text-black mb-4">
                Includes OSHA 10 and EPA 608 certification
              </p>
              <span className="text-brand-blue-600 font-semibold">
                Learn More →
              </span>
            </Link>

            <Link
              href="/programs/electrical"
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                Building Maintenance
              </h3>
              <p className="text-black mb-4">
                Includes OSHA 10/30 safety certifications
              </p>
              <span className="text-brand-blue-600 font-semibold">
                Learn More →
              </span>
            </Link>

            <Link
              href="/programs/cna"
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">Home Health Aide</h3>
              <p className="text-black mb-4">
                Includes bloodborne pathogens and infection control
              </p>
              <span className="text-brand-blue-600 font-semibold">
                Learn More →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg mb-8">
            Enroll in a program today and get free access to CareerSafe OSHA
            training
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="bg-white hover:bg-white text-brand-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
