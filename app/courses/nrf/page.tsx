import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  ExternalLink,
  Clock,
  Award,
  ShoppingBag,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/courses/nrf',
  },
  title: 'NRF RISE Up Credentials | Elevate For Humanity',
  description:
    'Industry-recognized retail and customer service credentials from the National Retail Federation. Free with program enrollment.',
};

export default async function NrfPage() {
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
  
  // Fetch NRF courses
  const { data: nrfCourses } = await db
    .from('training_courses')
    .select('*')
    .eq('provider', 'nrf');

  const courses = [
    {
      id: 'customer-service-sales',
      title: 'Customer Service & Sales',
      duration: '20-30 hours',
      price: 'Included',
      description:
        'Master customer interaction, sales techniques, and service excellence',
      certificate: 'NRF Customer Service & Sales Credential',
      topics: [
        'Customer interaction skills',
        'Sales techniques',
        'Service excellence',
        'Conflict resolution',
        'Communication skills',
      ],
    },
    {
      id: 'business-of-retail',
      title: 'Business of Retail',
      duration: '20-30 hours',
      price: 'Included',
      description:
        'Learn retail operations, business fundamentals, and industry knowledge',
      certificate: 'NRF Business of Retail Credential',
      topics: [
        'Retail operations',
        'Business fundamentals',
        'Industry knowledge',
        'Store management',
        'Inventory control',
      ],
    },
    {
      id: 'servsafe-manager',
      title: 'ServSafe Manager',
      duration: '8-10 hours',
      price: 'Included',
      description:
        'Food safety certification for restaurant managers and supervisors',
      certificate: 'ServSafe Manager Certification',
      topics: [
        'Food safety principles',
        'HACCP guidelines',
        'Manager responsibilities',
        'Health inspections',
        'Employee training',
      ],
    },
    {
      id: 'servsafe-food-handler',
      title: 'ServSafe Food Handler',
      duration: '2-3 hours',
      price: 'Included',
      description: 'Basic food safety training for all food service workers',
      certificate: 'ServSafe Food Handler Certificate',
      topics: [
        'Personal hygiene',
        'Cross-contamination',
        'Time and temperature',
        'Cleaning and sanitizing',
        'Safe food handling',
      ],
    },
    {
      id: 'servsafe-alcohol',
      title: 'ServSafe Alcohol',
      duration: '4-6 hours',
      price: 'Included',
      description:
        'Responsible alcohol service training for servers and bartenders',
      certificate: 'ServSafe Alcohol Certificate',
      topics: [
        'Responsible service',
        'Checking IDs',
        'Recognizing intoxication',
        'Legal responsibilities',
        'Intervention techniques',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'NRF RISE Up Credentials' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/courses-page-8.jpg"
          alt="NRF RISE Up Training"
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
            Why NRF RISE Up?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Industry-Recognized
              </h3>
              <p className="text-black">
                Credentials from the National Retail Federation, trusted by
                employers nationwide
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-slate-400 flex-shrink-0">•</span>
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Available Credentials
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h4 className="text-xl font-semibold mb-2">{course.title}</h4>
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
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{course.price}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="font-semibold text-sm mb-2">
                    Topics Covered:
                  </h5>
                  <ul className="text-sm text-black space-y-1">
                    {course.topics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-brand-blue-600 mt-1">•</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full justify-center"
                >
                  Enroll Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Using NRF */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Programs Including NRF Credentials
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link
              href="/training/certifications"
              className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                Workforce Readiness
              </h3>
              <p className="text-black mb-4">
                Includes NRF RISE Up credentials and job readiness training
              </p>
              <span className="text-brand-blue-600 font-semibold">
                Learn More →
              </span>
            </Link>

            <Link
              href="/training/certifications"
              className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">
                Business Startup & Marketing
              </h3>
              <p className="text-black mb-4">
                Includes retail business fundamentals and customer service
              </p>
              <span className="text-brand-blue-600 font-semibold">
                Learn More →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to Get Certified?
          </h2>
          <p className="text-base md:text-lg mb-8">
            Enroll in a program today and get free access to NRF RISE Up
            credentials
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="bg-white hover:bg-gray-100 text-brand-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
