import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Divorce Support | Rise Forward Foundation',
  description: 'Support and resources for individuals and families navigating divorce',
};

export default function DivorceSupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/rise-foundation" className="text-purple-600 hover:text-purple-700 mb-8 inline-block">
          ← Back to Rise Forward Foundation
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Divorce Support
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Compassionate support for individuals and families navigating the challenges of divorce.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Our Support Services
          </h2>
          <p className="text-gray-700 mb-4">
            Divorce can be one of life's most challenging transitions. We provide support to help
            you navigate this difficult time with grace and resilience.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Services Offered
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li>Individual counseling and emotional support</li>
            <li>Co-parenting guidance and strategies</li>
            <li>Support groups for divorced individuals</li>
            <li>Children and family counseling</li>
            <li>Financial planning and resources</li>
            <li>Legal resource referrals</li>
          </ul>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Get Support Today
            </h3>
            <p className="text-gray-700 mb-4">
              You don't have to navigate this alone. We're here to support you.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
