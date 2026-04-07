import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import Link from 'next/link';

import Image from 'next/image';
import { BookOpen, Award, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical:
      'https://www.elevateforhumanity.org/workforce-board/supportive-services',
  },
  title: 'Supportive Services | Elevate For Humanity',
  description:
    'Manage supportive services for program participants.',
};

export default function SupportiveServicesPage() {
  const services: any[] = [];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Workforce Board", href: "/workforce-board" }, { label: "Supportive Services" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/workforce-board-page-6.jpg"
          alt="Supportive Services"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={85}
        />
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">Supportive Services</h2>
                <p className="text-black mb-6">
                  Supportive services help remove barriers to participation — including
                  transportation assistance, childcare support, and emergency funds for
                  eligible workforce training participants.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-black flex-shrink-0">•</span>
                    <span>Free training for eligible participants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black flex-shrink-0">•</span>
                    <span>Industry-standard certifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-black flex-shrink-0">•</span>
                    <span>Career support and job placement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/pages/workforce-board-page-10.jpg"
                  alt="Supportive Services"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  quality={85}
                />
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <BookOpen className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Learn</h3>
                <p className="text-black">Access quality training programs</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Award className="w-8 h-8 text-brand-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Certify</h3>
                <p className="text-black">Earn industry certifications</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Briefcase className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Work</h3>
                <p className="text-black">Get hired in your field</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              Need Supportive Services?
            </h2>
            <p className="text-base md:text-lg text-white/90 mb-8">
              Contact our team to learn about available supportive services
              or apply for workforce training assistance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/apply"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/contact"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-900 border-2 border-white text-lg"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
