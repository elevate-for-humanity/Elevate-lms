import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | Elevate For Humanity',
  description: 'Acceptable Use Policy governing behavior and usage of the Elevate For Humanity platform.',
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Acceptable Use" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Acceptable Use Policy</h1>
          <p className="text-gray-500 mb-8">Version 1.0 | Effective: January 22, 2026</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              This Acceptable Use Policy ("AUP") governs how you may use the Elevate For Humanity platform. Violation of this policy may result in immediate suspension or termination.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Prohibited Activities</h2>
            <p className="text-gray-700 mb-4">
              You may NOT use the platform to:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Illegal Activities</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Violate any applicable law, regulation, or government requirement</li>
              <li>Commit fraud or misrepresent information</li>
              <li>Launder money or finance illegal activities</li>
              <li>Violate export control laws</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Harmful Content</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Upload malware, viruses, or malicious code</li>
              <li>Distribute spam or unsolicited communications</li>
              <li>Post content that is defamatory, obscene, or harassing</li>
              <li>Share content that infringes intellectual property rights</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Platform Abuse</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Circumvent usage limits or security measures</li>
              <li>Scrape, crawl, or harvest data without permission</li>
              <li>Use automated tools to access the platform (except approved APIs)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Misrepresentation</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Impersonate another person or organization</li>
              <li>Falsify credentials, certifications, or qualifications</li>
              <li>Misrepresent your relationship with Elevate For Humanity</li>
              <li>Create fake student records or enrollment data</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Compliance Responsibility</h2>
            <p className="text-gray-700 mb-4">
              <strong>You are solely responsible for compliance.</strong> This includes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Education regulations</strong> – State licensing, accreditation requirements</li>
              <li><strong>Privacy laws</strong> – FERPA, state privacy laws, data protection</li>
              <li><strong>Employment laws</strong> – If you employ staff or apprentices</li>
              <li><strong>Funding requirements</strong> – WIOA, grants, government program rules</li>
              <li><strong>Industry regulations</strong> – Healthcare, trades, professional licensing</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We provide tools. We do not provide compliance advice. Consult qualified professionals for compliance guidance.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Data Responsibility</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Accuracy of data you enter into the platform</li>
              <li>Obtaining necessary consents from students and users</li>
              <li>Protecting login credentials and access controls</li>
              <li>Reporting any suspected data breaches promptly</li>
              <li>Complying with data retention and deletion requirements</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify, defend, and hold harmless Elevate For Humanity from any claims, damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Your violation of this Acceptable Use Policy</li>
              <li>Your violation of any applicable law or regulation</li>
              <li>Your content or data uploaded to the platform</li>
              <li>Your interactions with students, staff, or third parties</li>
              <li>Any claim that your use infringes third-party rights</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Monitoring and Enforcement</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Monitor usage for compliance with this policy</li>
              <li>Investigate suspected violations</li>
              <li>Remove content that violates this policy</li>
              <li>Suspend or terminate accounts for violations</li>
              <li>Report illegal activities to law enforcement</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We may take action without prior notice if we believe there is an immediate risk of harm.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Reporting Violations</h2>
            <p className="text-gray-700 mb-4">
              If you become aware of any violation of this policy, please report it to: <a href="/contact" className="text-brand-green-600 hover:underline">Contact Us</a>
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                By using the Elevate For Humanity platform, you acknowledge that you have read, understood, and agree to comply with this Acceptable Use Policy.
              </p>
              <div className="mt-6 flex gap-4">
                <Link href="/legal/eula" className="text-brand-green-600 hover:underline">EULA</Link>
                <Link href="/terms-of-service" className="text-brand-green-600 hover:underline">Terms of Service</Link>
                <Link href="/legal/disclosures" className="text-brand-green-600 hover:underline">Disclosures</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
