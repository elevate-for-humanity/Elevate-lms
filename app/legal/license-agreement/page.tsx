import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'License Agreement | Elevate For Humanity',
  description: 'Software License Agreement for organizations licensing the Elevate For Humanity platform.',
};

export default function LicenseAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "License Agreement" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="inline-block px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-sm font-medium rounded-full mb-4">
            For Licensees
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Software License Agreement</h1>
          <p className="text-gray-500 mb-8">Version 1.0 | Effective: January 22, 2026</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              This Software License Agreement ("Agreement") governs your organization's license to use the Elevate For Humanity workforce development platform ("Platform").
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <p className="text-amber-800 font-medium">
                Important: This is a software license, not a partnership, joint venture, or service agreement. You are licensing technology. You are responsible for implementation, operation, and outcomes.
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. What You Are Licensing</h2>
            <p className="text-gray-700 mb-4">
              You are licensing access to a software platform that includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Learning management system (LMS) functionality</li>
              <li>Enrollment and student tracking tools</li>
              <li>Compliance and reporting features</li>
              <li>Administrative dashboards and portals</li>
              <li>Integration capabilities</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You are NOT licensing staff, consulting, implementation services, or operational support. The platform is self-service.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. License Scope</h2>
            <p className="text-gray-700 mb-4">
              Your license is:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Subscription-based</strong> – Valid for the paid subscription period</li>
              <li><strong>Tier-limited</strong> – Subject to the limits of your subscription tier (users, programs, etc.)</li>
              <li><strong>Organization-specific</strong> – For use by your organization only</li>
              <li><strong>Commercial use permitted</strong> – You may charge fees for courses, training, and services you deliver through the platform</li>
              <li><strong>Non-transferable</strong> – The license itself cannot be sold, assigned, or transferred to another organization</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Commercial Use Rights</h2>
            <p className="text-gray-700 mb-4">
              <strong>You CAN:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Charge students tuition or enrollment fees for courses delivered through the platform</li>
              <li>Offer paid training programs, certifications, and workforce development services</li>
              <li>Generate revenue from your educational and training operations</li>
              <li>Build a business using the platform as your technology infrastructure</li>
              <li>Set your own pricing for your services</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>You CANNOT:</strong>
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Resell, sublicense, or redistribute the platform software itself</li>
              <li>Claim ownership of the platform or its technology</li>
              <li>Sell access to the platform as if it were your own product</li>
              <li>White-label or rebrand the platform as your own software</li>
              <li>Transfer your license to another organization</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>In plain terms:</strong> You can make money using the platform to deliver services. You cannot make money selling the platform itself.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Your Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              As a licensee, YOU are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Implementation</strong> – Setting up and configuring the platform for your needs</li>
              <li><strong>Content</strong> – Creating, uploading, and maintaining your courses and materials</li>
              <li><strong>Compliance</strong> – Ensuring your use complies with all applicable laws and regulations</li>
              <li><strong>Data accuracy</strong> – Maintaining accurate student and organizational records</li>
              <li><strong>User management</strong> – Managing your staff and student accounts</li>
              <li><strong>Training</strong> – Training your staff to use the platform</li>
              <li><strong>Outcomes</strong> – Your results depend on how you implement and use the platform</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. What We Provide</h2>
            <p className="text-gray-700 mb-4">
              We provide:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Access to the platform during your subscription</li>
              <li>Platform updates and improvements</li>
              <li>Technical documentation</li>
              <li>Standard technical support (per your tier)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We do NOT provide:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Implementation or setup services</li>
              <li>Custom development</li>
              <li>Consulting or advisory services</li>
              <li>Staffing or operational support</li>
              <li>Guaranteed outcomes or results</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. No Partnership</h2>
            <p className="text-gray-700 mb-4">
              This Agreement explicitly does NOT create:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>A partnership between you and Elevate For Humanity</li>
              <li>A joint venture or co-ownership arrangement</li>
              <li>An agency relationship</li>
              <li>An employer-employee relationship</li>
              <li>A franchise arrangement</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You may not represent yourself as a partner, affiliate, or representative of Elevate For Humanity. You may state that you use or are licensed to use the platform.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              <strong>Our IP:</strong> We retain all ownership of the platform, software, code, design, and all intellectual property. Your license grants usage rights only, not ownership.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Your IP:</strong> You retain ownership of content you create and upload. You grant us a license to host and display that content as necessary to provide the service.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Fees and Payment</h2>
            <p className="text-gray-700 mb-4">
              License fees are due according to your subscription terms (monthly or annual). Failure to pay may result in suspension or termination of your license.
            </p>
            <p className="text-gray-700 mb-4">
              Fees are non-refundable except as required by law or as specified in our refund policy.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Term and Termination</h2>
            <p className="text-gray-700 mb-4">
              This Agreement continues for the duration of your paid subscription. Either party may terminate:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>At the end of any subscription period with notice</li>
              <li>Immediately for material breach</li>
              <li>Immediately for non-payment</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Upon termination, your access ends immediately. You should export your data before termination. We may delete your data after 30 days.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>We are not liable for indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to fees paid in the 12 months before the claim</li>
              <li>We are not responsible for your outcomes, compliance, or operational results</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              This Agreement is governed by the laws of the State of Indiana, United States. Any disputes shall be resolved in the courts of Marion County, Indiana.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                By purchasing a license or using the Elevate For Humanity platform as a licensee, you acknowledge that you have read, understood, and agree to be bound by this Software License Agreement.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/legal/eula" className="text-brand-green-600 hover:underline">EULA</Link>
                <Link href="/legal/acceptable-use" className="text-brand-green-600 hover:underline">Acceptable Use Policy</Link>
                <Link href="/legal/disclosures" className="text-brand-green-600 hover:underline">Disclosures</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
