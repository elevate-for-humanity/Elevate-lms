import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Clock, Award, Truck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/nds',
  },
  title: 'DOT Compliance Training | Elevate For Humanity',
  description:
    'DOT-required training for CDL drivers and transportation professionals. Drug & alcohol testing, FMCSA regulations, and safety compliance.',
};

export default async function NdsPage() {
  const supabase = await createClient();

  
  // Fetch NDS courses
  const { data: ndsCourses } = await supabase
    .from('training_courses')
    .select('*')
    .eq('provider', 'nds');
  const courseCategories = [
    {
      name: 'DOT Required Training',
      courses: [
        {
          id: 'dot-drug-alcohol',
          title: 'DOT Drug & Alcohol Testing',
          duration: '2-3 hours',
          price: 'Included',
          description:
            'Required DOT training for all CDL drivers and safety-sensitive employees',
          certificate: 'DOT Compliance Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/dot-drug-alcohol',
        },
        {
          id: 'fmcsa-regulations',
          title: 'FMCSA Regulations Training',
          duration: '3-4 hours',
          price: 'Included',
          description:
            'Federal Motor Carrier Safety Administration regulations for commercial drivers',
          certificate: 'FMCSA Compliance Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/fmcsa-regulations',
        },
        {
          id: 'hours-of-service',
          title: 'Hours of Service (HOS) Training',
          duration: '2 hours',
          price: 'Included',
          description:
            'DOT hours of service regulations and electronic logging devices',
          certificate: 'HOS Compliance Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/hours-of-service',
        },
      ],
    },
    {
      name: 'CDL Training',
      courses: [
        {
          id: 'pre-trip-inspection',
          title: 'Pre-Trip Inspection Training',
          duration: '2-3 hours',
          price: 'Included',
          description:
            'Complete pre-trip inspection procedures for CDL testing',
          certificate: 'Pre-Trip Inspection Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/pre-trip-inspection',
        },
        {
          id: 'cdl-test-prep',
          title: 'CDL Test Preparation',
          duration: '4-6 hours',
          price: 'Included',
          description:
            'Comprehensive preparation for CDL written and skills tests',
          certificate: 'CDL Test Prep Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/cdl-test-prep',
        },
      ],
    },
    {
      name: 'Supervisor Training',
      courses: [
        {
          id: 'reasonable-suspicion',
          title: 'DOT Reasonable Suspicion Training',
          duration: '2 hours',
          price: 'Included',
          description:
            'Required training for supervisors to identify drug and alcohol use',
          certificate: 'DOT Supervisor Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/reasonable-suspicion',
        },
        {
          id: 'supervisor-training',
          title: 'DOT Supervisor Training',
          duration: '2-3 hours',
          price: 'Included',
          description:
            'Comprehensive DOT compliance training for transportation supervisors',
          certificate: 'DOT Supervisor Certificate',
          enrollUrl: 'https://www.mydrugtest training.com/supervisor-training',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'DOT Compliance Training' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/courses-page-5.jpg"
          alt="DOT Compliance Training"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why DOT Training?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-brand-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">DOT Required</h3>
              <p className="text-black">
                Federally mandated training for all commercial drivers and
                supervisors
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black flex-shrink-0">•</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Funded</h3>
              <p className="text-black">
                Included with CDL program enrollment through WIOA or WRG funding
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
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Available Courses
          </h2>

          {courseCategories.map((category) => (
            <div key={category.name} className="mb-12">
              <h3 className="text-lg md:text-lg font-bold mb-6 text-brand-red-900">
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
                        <span className="text-black flex-shrink-0">•</span>
                        <span>{course.price}</span>
                      </div>
                    </div>

                    <Link
                      href={course.enrollUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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

      {/* Programs Using NDS */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Programs Including DOT Training
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link
              href="/programs/cdl-training"
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">CDL Training</h3>
              <p className="text-black mb-4">
                Includes all DOT-required training and compliance courses
              </p>
              <span className="text-brand-orange-600 font-semibold">Learn More →</span>
            </Link>

            <Link
              href="/training/certifications"
              className="bg-white rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                Drug Collector Certification
              </h3>
              <p className="text-black mb-4">
                Includes DOT drug testing procedures and compliance
              </p>
              <span className="text-brand-orange-600 font-semibold">Learn More →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Get DOT Certified?
          </h2>
          <p className="text-base md:text-lg mb-8">
            Enroll in a program today and get free access to all DOT compliance
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
              className="bg-white hover:bg-white text-brand-red-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
