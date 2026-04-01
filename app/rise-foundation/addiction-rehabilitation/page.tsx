import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Addiction Rehabilitation | Rise Forward Foundation',
  description: 'Support and resources for addiction recovery and rehabilitation',
};

export default function AddictionRehabilitationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/rise-foundation" className="text-purple-600 hover:text-purple-700 mb-8 inline-block">
          ← Back to Rise Forward Foundation
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Addiction Rehabilitation
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive support for individuals on the path to recovery from addiction.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Our Programs
          </h2>
          <p className="text-gray-700 mb-4">
            We offer evidence-based addiction rehabilitation programs that address the whole person,
            supporting physical, mental, and emotional recovery.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Services Offered
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li>Individual counseling and therapy</li>
            <li>Group support sessions</li>
            <li>12-step program facilitation</li>
            <li>Family support and education</li>
            <li>Relapse prevention strategies</li>
            <li>Holistic wellness programs</li>
          </ul>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Start Your Recovery Journey
            </h3>
            <p className="text-gray-700 mb-4">
              Recovery is possible. Reach out today to learn more about our programs.
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
