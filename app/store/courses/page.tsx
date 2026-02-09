import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Award, Clock, Check, ArrowRight, BookOpen, Shield } from 'lucide-react';
import { COURSES as courses } from '@/app/data/courses';

export const metadata: Metadata = {
  title: 'Certification Courses | Elevate Store',
  description:
    'Industry-recognized certification courses with exam vouchers. Microsoft Office, Adobe Creative, OSHA Safety, Healthcare, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/courses',
  },
};

export default function StoreCoursesPage() {
  // Group courses by category
  const categories = [
    { name: 'Microsoft Office', filter: (c: any) => c.category === 'microsoft-office' },
    { name: 'Adobe Creative', filter: (c: any) => c.category === 'adobe-creative' },
    { name: 'IT & Cybersecurity', filter: (c: any) => c.category === 'it-cybersecurity' },
    { name: 'Healthcare & Safety', filter: (c: any) => c.category === 'healthcare-safety' },
    { name: 'Business & Accounting', filter: (c: any) => c.category === 'business-accounting' },
    { name: 'Workplace Safety', filter: (c: any) => c.category === 'workplace-safety' },
  ];

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Courses" }]} />
      </div>
{/* Hero */}
      <section className="relative min-h-[400px] flex items-center overflow-hidden bg-purple-900">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home.mp4" type="video/mp4" />
        </video>
        

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-bold mb-6 border border-white/20">
              <Award className="w-4 h-4" />
              Industry-Recognized Certifications
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
              Certification Courses
              <span className="block text-purple-300">With Exam Vouchers</span>
            </h1>

            <p className="text-xl text-blue-100 mb-8">
              Get certified in Microsoft Office, Adobe Creative Suite, OSHA Safety, and more. 
              Each course includes the certification exam voucher.
            </p>

            <div className="flex flex-wrap gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Exam voucher included</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Self-paced learning</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Certificate on completion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="relative h-48">
                  <Image
                    src={course.image || '/images/courses/default.jpg'}
                    alt={course.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                    {course.provider}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.shortDescription}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.format}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <span className="text-2xl font-black text-gray-900">
                        ${course.price}
                      </span>
                    </div>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Accredited Providers</h3>
              <p className="text-gray-600">
                All certifications from recognized providers like Certiport, HSI, and CareerSafe.
              </p>
            </div>
            <div>
              <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Exam Voucher Included</h3>
              <p className="text-gray-600">
                Every course includes the certification exam voucher - no hidden costs.
              </p>
            </div>
            <div>
              <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Self-Paced Learning</h3>
              <p className="text-gray-600">
                Learn at your own pace with lifetime access to course materials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Need Multiple Certifications?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us for volume pricing on team certifications.
          </p>
          <Link
            href="/contact?topic=bulk-courses"
            className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Get Volume Pricing
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
