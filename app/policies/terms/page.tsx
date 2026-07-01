import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Terms of Service | {PLATFORM_DEFAULTS.orgName}',
  description: 'Legal terms for using our platform and services, user responsibilities, and limitations of liability.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Terms of Service</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Acceptance of Terms</h2>
            <p className="text-black mb-6">
              These Terms of Service ("Terms") govern your access to and use of {PLATFORM_DEFAULTS.orgName}'s website, 
              learning management system, and related services (collectively, the "Platform"). By accessing or 
              using the Platform, you agree to be bound by these Terms. If you do not agree, do not use the Platform.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Definitions</h2>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>"We," "Us," "Our":</strong> {PLATFORM_DEFAULTS.orgName}</li>
              <li><strong>"You," "Your":</strong> The user of the Platform</li>
              <li><strong>"Platform":</strong> Our website, LMS, and all related services</li>
              <li><strong>"Content":</strong> All materials, information, and data on the Platform</li>
              <li><strong>"Services":</strong> Educational programs, training, and related offerings</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Eligibility</h2>
            <p className="text-black mb-4">
              To use the Platform, you must:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Be at least 18 years old (or 16-17 with parental consent)</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Platform under applicable law</li>
              <li>Provide accurate and complete registration information</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">User Accounts</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Account Creation</h3>
            <p className="text-black mb-4">
              When creating an account:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Choose a secure password and keep it confidential</li>
              <li>Do not share your account credentials</li>
              <li>Notify us immediately of unauthorized access</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Account Responsibility</h3>
            <p className="text-black mb-6">
              You are responsible for all activity that occurs under your account. We are not liable for any 
              loss or damage from unauthorized use of your account.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Use of Platform</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">License Grant</h3>
            <p className="text-black mb-6">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the 
              Platform for personal, educational purposes in accordance with these Terms.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Restrictions</h3>
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200 mb-6">
              <p className="text-black mb-4">
                You may NOT:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Copy, modify, or distribute Platform content without permission</li>
                <li>Reverse engineer, decompile, or disassemble the Platform</li>
                <li>Use automated systems (bots, scrapers) to access the Platform</li>
                <li>Interfere with or disrupt Platform operation</li>
                <li>Attempt to gain unauthorized access to systems or data</li>
                <li>Use the Platform for illegal or unauthorized purposes</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe intellectual property rights</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Impersonate others or misrepresent affiliation</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Our Content</h3>
            <p className="text-black mb-6">
              All Platform content, including text, graphics, logos, images, software, and course materials, 
              is owned by or licensed to {PLATFORM_DEFAULTS.orgName} and protected by copyright, trademark, and other 
              intellectual property laws.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Your Content</h3>
            <p className="text-black mb-4">
              When you post content on the Platform:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>You retain ownership of your content</li>
              <li>You grant us a license to use, display, and distribute your content</li>
              <li>You represent that you have rights to post the content</li>
              <li>You are responsible for your content and its legality</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Payment Terms</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Fees and Payment</h3>
            <p className="text-black mb-4">
              For paid services:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Fees are stated at time of enrollment</li>
              <li>Payment is due according to agreed schedule</li>
              <li>We accept various payment methods</li>
              <li>All fees are in U.S. dollars</li>
              <li>Prices subject to change with notice</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Refunds</h3>
            <p className="text-black mb-6">
              Refund policies vary by program. See specific program terms or contact admissions for details. 
              Generally, refunds are prorated based on completion percentage and timing of withdrawal.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Termination</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">By You</h3>
            <p className="text-black mb-6">
              You may terminate your account at any time by contacting us. Termination does not relieve you 
              of payment obligations for services already provided.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">By Us</h3>
            <p className="text-black mb-4">
              We may suspend or terminate your access:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>For violation of these Terms</li>
              <li>For violation of other policies</li>
              <li>For non-payment of fees</li>
              <li>For fraudulent or illegal activity</li>
              <li>At our discretion with or without cause</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Disclaimers</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">"As Is" Provision</h3>
              <p className="text-black mb-4">
                THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR 
                IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Warranties of merchantability</li>
                <li>Fitness for a particular purpose</li>
                <li>Non-infringement</li>
                <li>Accuracy or completeness of content</li>
                <li>Uninterrupted or error-free operation</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">No Guarantee of Results</h3>
            <p className="text-black mb-6">
              While we strive to provide quality education, we do not guarantee:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Job placement or employment</li>
              <li>Specific salary or income levels</li>
              <li>Passage of certification exams</li>
              <li>Specific educational outcomes</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Limitation of Liability</h2>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <p className="text-black mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ELEVATE FOR HUMANITY SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or use</li>
                <li>Business interruption</li>
                <li>Personal injury or property damage</li>
                <li>Damages arising from use or inability to use the Platform</li>
              </ul>
              <p className="text-black mt-4">
                Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Indemnification</h2>
            <p className="text-black mb-6">
              You agree to indemnify, defend, and hold harmless {PLATFORM_DEFAULTS.orgName}, its officers, directors, 
              employees, and agents from any claims, damages, losses, liabilities, and expenses (including 
              attorney fees) arising from your use of the Platform or violation of these Terms.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Dispute Resolution</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Informal Resolution</h3>
            <p className="text-black mb-6">
              Before filing a claim, contact us at legal@www.elevateforhumanity.org to attempt informal resolution.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Arbitration</h3>
            <p className="text-black mb-6">
              Any disputes not resolved informally shall be resolved through binding arbitration in accordance 
              with the American Arbitration Association rules. Arbitration shall take place in Indianapolis, Indiana.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Class Action Waiver</h3>
            <p className="text-black mb-6">
              You agree to bring claims only in your individual capacity and not as part of any class or 
              representative action.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">General Provisions</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Governing Law</h3>
            <p className="text-black mb-6">
              These Terms are governed by the laws of the State of Indiana, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Changes to Terms</h3>
            <p className="text-black mb-6">
              We may modify these Terms at any time. Changes effective upon posting. Continued use constitutes 
              acceptance of modified Terms. Material changes will be notified via email or Platform notice.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Severability</h3>
            <p className="text-black mb-6">
              If any provision is found invalid or unenforceable, remaining provisions remain in full effect.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Entire Agreement</h3>
            <p className="text-black mb-6">
              These Terms, together with our Privacy Policy and other referenced policies, constitute the entire 
              agreement between you and {PLATFORM_DEFAULTS.orgName}.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions about these Terms:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> legal@www.elevateforhumanity.org</li>
              <li><strong>Phone:</strong> {PLATFORM_DEFAULTS.supportPhone}</li>
              <li><strong>Mail:</strong> {PLATFORM_DEFAULTS.orgName}</li>
              <li className="ml-6">123 Main Street</li>
              <li className="ml-6">Indianapolis, IN 46204</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/privacy" className="text-blue-600 hover:underline">Privacy Policy</a></li>
                <li><a href="/policies/acceptable-use" className="text-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/policies/copyright" className="text-blue-600 hover:underline">Copyright Policy</a></li>
                <li><a href="/policies/student-code" className="text-blue-600 hover:underline">Student Code of Conduct</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
