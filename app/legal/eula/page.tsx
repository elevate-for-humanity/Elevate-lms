import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'End User License Agreement | Elevate For Humanity',
  description: 'End User License Agreement governing use of the Elevate For Humanity platform.',
};

export default function EULAPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Eula" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">End User License Agreement</h1>
          <p className="text-gray-500 mb-8">Version 1.0 | Effective: January 22, 2026</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              This End User License Agreement ("EULA") is a legal agreement between you and Elevate For Humanity ("we," "us," or "Company") governing your use of our platform, software, and services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Ownership</h2>
            <p className="text-gray-700 mb-4">
              <strong>We own everything.</strong> The platform, software, code, design, content, workflows, and all intellectual property belong exclusively to Elevate For Humanity. This includes all updates, modifications, and derivative works.
            </p>
            <p className="text-gray-700 mb-4">
              Your use of the platform does not transfer any ownership rights to you. You receive only the limited usage rights described in this agreement.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. License Grant</h2>
            <p className="text-gray-700 mb-4">
              Subject to your compliance with this EULA and payment of applicable fees, we grant you a:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Non-exclusive</strong> – We may license the platform to others</li>
              <li><strong>Non-transferable</strong> – You cannot transfer your license to anyone else</li>
              <li><strong>Limited</strong> – Only for the purposes described in your subscription</li>
              <li><strong>Revocable</strong> – We may terminate for breach or non-payment</li>
            </ul>
            <p className="text-gray-700 mb-4">
              license to access and use the platform for your internal business operations.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. What This Is NOT</h2>
            <p className="text-gray-700 mb-4">
              This agreement does NOT create:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>A partnership</strong> – You are not our partner</li>
              <li><strong>A joint venture</strong> – We are not in business together</li>
              <li><strong>An agency relationship</strong> – You cannot act on our behalf</li>
              <li><strong>An employment relationship</strong> – You are not our employee</li>
              <li><strong>A franchise</strong> – This is not a franchise arrangement</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You are a licensee. You pay for access. You operate independently. We provide software, not services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Restrictions</h2>
            <p className="text-gray-700 mb-4">
              You may NOT:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Copy, modify, or create derivative works of the platform</li>
              <li>Reverse engineer, decompile, or disassemble the software</li>
              <li>Resell, sublicense, or redistribute access to the platform</li>
              <li>Remove or alter any proprietary notices or labels</li>
              <li>Use the platform to build a competing product</li>
              <li>Share your login credentials with unauthorized users</li>
              <li>Exceed the usage limits of your subscription tier</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Your Content</h2>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you upload to the platform (student records, course materials you create, etc.). However, you grant us a license to host, store, and display that content as necessary to provide the service.
            </p>
            <p className="text-gray-700 mb-4">
              You are solely responsible for the accuracy, legality, and appropriateness of your content.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your license immediately if you:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Breach any term of this agreement</li>
              <li>Fail to pay fees when due</li>
              <li>Use the platform for illegal purposes</li>
              <li>Attempt to harm the platform or other users</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Upon termination, your right to use the platform ends immediately. We may delete your data after a reasonable period.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Updates</h2>
            <p className="text-gray-700 mb-4">
              We may update the platform at any time. Updates may add, modify, or remove features. We are not obligated to maintain any specific functionality.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              This agreement is governed by the laws of the State of Indiana, United States, without regard to conflict of law principles.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. Entire Agreement</h2>
            <p className="text-gray-700 mb-4">
              This EULA, together with our Terms of Service, Acceptable Use Policy, and Disclosures, constitutes the entire agreement between you and Elevate For Humanity regarding use of the platform.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                By using the Elevate For Humanity platform, you acknowledge that you have read, understood, and agree to be bound by this End User License Agreement.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/legal/terms-of-service" className="text-brand-green-600 hover:underline">Terms of Service</Link>
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
