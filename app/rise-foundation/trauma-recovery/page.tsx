import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trauma Recovery | Rise Forward Foundation',
  description: 'Support and resources for trauma recovery and healing',
};

export default function TraumaRecoveryPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Link href="/rise-foundation" className="text-purple-600 hover:text-purple-700 mb-8 inline-block">
          ← Back to Rise Forward Foundation
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Trauma Recovery
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Supporting individuals on their journey to healing and recovery from trauma.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Our Approach
          </h2>
          <p className="text-gray-700 mb-4">
            We provide compassionate, evidence-based support for individuals recovering from trauma.
            Our programs focus on holistic healing, addressing mind, body, and spirit.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            Services Offered
          </h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-8">
            <li>Individual counseling and support</li>
            <li>Group therapy sessions</li>
            <li>Mindfulness and meditation practices</li>
            <li>Holistic healing workshops</li>
            <li>Peer support networks</li>
          </ul>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Get Support
            </h3>
            <p className="text-gray-700 mb-4">
              If you or someone you know needs trauma recovery support, we're here to help.
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
