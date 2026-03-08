
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclosures | Elevate For Humanity',
  description: 'Important disclosures and disclaimers for users of the Elevate For Humanity platform.',
};

export default function DisclosuresPage() {

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Disclosures" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disclosures</h1>
          <p className="text-gray-500 mb-8">Version 1.0 | Effective: January 22, 2026</p>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              These disclosures clarify what the Elevate For Humanity platform is and is not. Please read carefully before using the platform or purchasing a license.
            </p>

            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-brand-red-800 mb-3">No Guarantees</h2>
              <p className="text-brand-red-700">
                <strong>We do not guarantee any outcomes.</strong> This includes but is not limited to: job placement, income levels, certification pass rates, funding approval, enrollment numbers, revenue, or business success. Your results depend entirely on how you implement and use the platform.
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. What We Are</h2>
            <p className="text-gray-700 mb-4">
              Elevate For Humanity is a <strong>software platform</strong>. We provide technology tools for workforce development, learning management, and program administration.
            </p>
            <p className="text-gray-700 mb-4">
              Elevate for Humanity is a workforce training institute. We also license the platform we built to other workforce organizations.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. What We Are NOT</h2>
            <p className="text-gray-700 mb-4">
              We are NOT:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>A school or educational institution</strong> – We provide tools, not education</li>
              <li><strong>An accrediting body</strong> – We do not grant accreditation</li>
              <li><strong>A licensing authority</strong> – We do not issue professional licenses</li>
              <li><strong>A staffing agency</strong> – We do not employ or place workers</li>
              <li><strong>A consulting firm</strong> – We do not provide advisory services</li>
              <li><strong>A law firm</strong> – We do not provide legal advice</li>
              <li><strong>An accounting firm</strong> – We do not provide financial advice</li>
              <li><strong>A compliance service</strong> – We do not ensure your compliance</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. No Professional Advice</h2>
            <p className="text-gray-700 mb-4">
              Nothing on this platform constitutes:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Legal advice</strong> – Consult a licensed attorney</li>
              <li><strong>Financial advice</strong> – Consult a licensed financial advisor</li>
              <li><strong>Tax advice</strong> – Consult a licensed tax professional</li>
              <li><strong>Compliance advice</strong> – Consult qualified compliance professionals</li>
              <li><strong>Medical advice</strong> – Consult licensed healthcare providers</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Any information, templates, or tools provided are for general informational purposes only and should not be relied upon as professional advice.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Your Responsibility</h2>
            <p className="text-gray-700 mb-4">
              You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>How you implement and configure the platform</li>
              <li>The content you create and upload</li>
              <li>The accuracy of your data and records</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Your interactions with students, staff, and third parties</li>
              <li>Your business decisions and outcomes</li>
              <li>Obtaining necessary licenses, permits, and approvals</li>
              <li>Training your staff to use the platform</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. Results Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              Any examples, case studies, or testimonials shown are for illustrative purposes only. They represent individual results and are not guarantees of future performance.
            </p>
            <p className="text-gray-700 mb-4">
              Factors that affect results include but are not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Your implementation quality</li>
              <li>Your content and curriculum</li>
              <li>Your marketing and recruitment</li>
              <li>Your staff capabilities</li>
              <li>Your local market conditions</li>
              <li>Economic factors beyond anyone's control</li>
              <li>Regulatory changes</li>
              <li>Student effort and circumstances</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              The platform may integrate with or link to third-party services. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>The availability or performance of third-party services</li>
              <li>The accuracy of third-party content</li>
              <li>Your agreements with third parties</li>
              <li>Data shared with third parties through integrations you enable</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">7. Platform Availability</h2>
            <p className="text-gray-700 mb-4">
              While we strive for high availability, we do not guarantee:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>100% uptime or uninterrupted access</li>
              <li>That the platform will be error-free</li>
              <li>That all features will always be available</li>
              <li>That the platform will meet all your specific requirements</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">8. Funding and Grants</h2>
            <p className="text-gray-700 mb-4">
              If you use the platform in connection with government funding (WIOA, grants, etc.):
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>We do not guarantee funding approval</li>
              <li>We do not guarantee continued funding</li>
              <li>You are responsible for meeting all funding requirements</li>
              <li>You are responsible for accurate reporting to funders</li>
              <li>We are not a party to your funding agreements</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">9. No Partnership</h2>
            <p className="text-gray-700 mb-4">
              Using this platform does not make you a partner, affiliate, representative, or agent of Elevate For Humanity. You are a customer licensing software. Nothing more.
            </p>

            <div className="mt-12 pt-8 border-t border-gray-200 bg-gray-50 -mx-8 md:-mx-12 px-8 md:px-12 pb-8 -mb-8 md:-mb-12 rounded-b-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acknowledgment</h2>
              <p className="text-gray-700 mb-4">
                By using the Elevate For Humanity platform, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>You have read and understood these disclosures</li>
                <li>You accept that no outcomes are guaranteed</li>
                <li>You are responsible for your own implementation and results</li>
                <li>You will seek qualified professional advice for legal, financial, and compliance matters</li>
                <li>You understand this is a software license, not a partnership or service agreement</li>
              </ul>
              <div className="mt-6 flex gap-4">
                <Link href="/legal/eula" className="text-brand-green-600 hover:underline">EULA</Link>
                <Link href="/terms-of-service" className="text-brand-green-600 hover:underline">Terms of Service</Link>
                <Link href="/legal/acceptable-use" className="text-brand-green-600 hover:underline">Acceptable Use Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
