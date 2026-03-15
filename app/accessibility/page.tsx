import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Accessibility, Mail, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/accessibility',
  },
  title: 'Accessibility Statement | Elevate For Humanity',
  description:
    'Accessibility commitment and support for Elevate for Humanity services.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Accessibility' }]} />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/accessibility-hero.jpg"
          alt="Accessibility Commitment"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <p className="text-xl text-black leading-relaxed mb-6">
            Elevate for Humanity is committed to accessibility for all
            individuals.
          </p>

          <p className="text-lg text-black leading-relaxed mb-6">
            We strive to ensure our website, programs, and services are
            accessible to people with disabilities. We are continuously working
            to improve the accessibility of our content and services.
          </p>

          <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-6 my-6">
            <p className="text-lg text-black font-semibold">
              If you experience difficulty accessing content or services, please
              contact us and we will assist promptly.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Our Commitment Includes
          </h2>

          <ul className="space-y-4 text-black">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>
                Providing alternative formats for documents and materials when
                requested
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>
                Ensuring physical locations are accessible or providing
                alternative arrangements
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Offering accommodations for program participation</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>
                Working with partners to ensure accessible training environments
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Providing support services to address barriers</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            Website Accessibility
          </h2>

          <p className="text-black mb-4">
            We aim to meet WCAG 2.1 Level AA standards and are working to:
          </p>

          <ul className="space-y-3 text-black">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Ensure proper heading structure and navigation</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Provide text alternatives for images</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Maintain sufficient color contrast</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Support keyboard navigation</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Ensure compatibility with screen readers</span>
            </li>
          </ul>
        </div>

        <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-6 mb-8">
          <h3 className="text-xl font-bold text-black mb-4">
            Need Assistance?
          </h3>
          <p className="text-black mb-4">
            If you need help accessing our website, programs, or services,
            please contact us:
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-brand-blue-600" />
              <a
                href="/contact"
                className="text-brand-blue-600 hover:underline font-semibold"
              >
                our contact form
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-brand-blue-600" />
              <a
                href="/support"
                className="text-brand-blue-600 hover:underline font-semibold"
              >
                Visit Support Center
              </a>
            </div>
          </div>

          <p className="text-black mt-4">
            We will work with you to provide the information or service you need
            in an accessible format.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-black mb-4">Feedback</h2>
          <p className="text-black">
            We welcome feedback on the accessibility of our services. If you
            encounter accessibility barriers or have suggestions for
            improvement, please let us know. Your feedback helps us improve
            access for everyone.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-brand-blue-600 text-white rounded-lg text-lg font-bold hover:bg-brand-blue-700 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
