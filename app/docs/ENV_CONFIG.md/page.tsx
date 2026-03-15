
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Award, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/docs/ENV_CONFIG.md',
  },
  title: 'ENV_CONFIG.md | Elevate For Humanity',
  description:
    'Environment configuration documentation for developers.',
};

export default function ENVCONFIGmdPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Env_Config.Md" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/docs-page-1.jpg"
          alt="Environment Configuration"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">ENV_CONFIG.md</h2>
                <p className="text-black mb-6">
                  Manage ENV_CONFIG.md for career
                  workforce training and career success.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Free training for eligible participants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Industry-standard certifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Career support and job placement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/pages/env-config-hero.jpg"
                  alt="Configuration guide"
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
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
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Explore training programs and earn industry certifications through our
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
