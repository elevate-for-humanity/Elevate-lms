import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Privacy Policy | {PLATFORM_DEFAULTS.orgName}',
  description: 'How we collect, use, protect, and share your personal information and educational records.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Privacy Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Introduction</h2>
            <p className="text-black mb-6">
              {PLATFORM_DEFAULTS.orgName} ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our website, 
              learning management system, and services. We comply with FERPA, GDPR, CCPA, and other applicable 
              privacy laws.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Personal Information</h3>
            <p className="text-black mb-4">
              We collect information you provide directly:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Contact Information:</strong> Name, email address, phone number, mailing address</li>
              <li><strong>Identification:</strong> Date of birth, Social Security number (for enrollment), government ID</li>
              <li><strong>Demographic Information:</strong> Gender, race/ethnicity (optional, for reporting)</li>
              <li><strong>Emergency Contacts:</strong> Names and contact information</li>
              <li><strong>Employment Information:</strong> Work history, employer details</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Educational Records</h3>
            <p className="text-black mb-4">
              Protected under FERPA:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Enrollment information and program details</li>
              <li>Academic performance, grades, and assessments</li>
              <li>Attendance records</li>
              <li>Course materials and submissions</li>
              <li>Transcripts and credentials</li>
              <li>Financial aid and payment information</li>
              <li>Disciplinary records</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Technical Information</h3>
            <p className="text-black mb-4">
              Automatically collected:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited and time spent</li>
              <li>Referring website</li>
              <li>Cookies and tracking technologies</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Financial Information</h3>
            <p className="text-black mb-6">
              Payment information is processed securely through third-party payment processors (Stripe). We do not 
              store full credit card numbers. We retain transaction records and payment history.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">How We Use Your Information</h2>
            
            <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Primary Uses</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Provide Services:</strong> Deliver educational programs, process enrollments, issue credentials</li>
                <li><strong>Communication:</strong> Send important updates, announcements, and support responses</li>
                <li><strong>Improvement:</strong> Analyze usage to improve platform and services</li>
                <li><strong>Compliance:</strong> Meet legal and regulatory requirements</li>
                <li><strong>Safety:</strong> Protect against fraud, abuse, and security threats</li>
                <li><strong>Research:</strong> Conduct educational research (anonymized data)</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">How We Share Your Information</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">With Your Consent</h3>
            <p className="text-black mb-6">
              We share information when you authorize us to do so, such as sharing credentials with employers 
              or transcripts with other institutions.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Service Providers</h3>
            <p className="text-black mb-4">
              We share with third parties who help us operate:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Learning management system providers</li>
              <li>Payment processors (Stripe)</li>
              <li>Email service providers</li>
              <li>Cloud hosting services (Vercel, Supabase)</li>
              <li>Analytics providers</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Legal Requirements</h3>
            <p className="text-black mb-4">
              We disclose information when required by law:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Court orders and subpoenas</li>
              <li>Government agency requests</li>
              <li>Law enforcement investigations</li>
              <li>Protection of rights and safety</li>
              <li>Compliance with regulations</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Funding Sources</h3>
            <p className="text-black mb-6">
              For government-funded programs, we share required information with funding agencies (WIOA, 
              Vocational Rehabilitation, VA, etc.) for eligibility verification and reporting.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Your Privacy Rights</h2>
            
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">You Have the Right To:</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correct:</strong> Request correction of inaccurate information</li>
                <li><strong>Delete:</strong> Request deletion (subject to legal requirements)</li>
                <li><strong>Restrict:</strong> Limit how we use your information</li>
                <li><strong>Object:</strong> Object to certain processing activities</li>
                <li><strong>Portability:</strong> Receive your data in portable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Complain:</strong> File complaints with supervisory authorities</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">FERPA Rights</h3>
            <p className="text-black mb-4">
              Under FERPA, students have the right to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Inspect and review educational records</li>
              <li>Request amendments to inaccurate records</li>
              <li>Consent to disclosures (with exceptions)</li>
              <li>File complaints with the Department of Education</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Data Security</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Security Measures</h3>
            <p className="text-black mb-4">
              We protect your information through:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Encryption in transit (SSL/TLS) and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and testing</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
              <li>Limited access on need-to-know basis</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Data Breach Notification</h3>
            <p className="text-black mb-6">
              In the event of a data breach affecting your information, we will notify you and relevant 
              authorities as required by law, typically within 72 hours of discovery.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Cookies and Tracking</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Types of Cookies</h3>
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <ul className="space-y-3 text-black">
                <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand usage patterns</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences</li>
                <li><strong>Marketing Cookies:</strong> Track effectiveness of campaigns</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Managing Cookies</h3>
            <p className="text-black mb-6">
              You can control cookies through your browser settings. Note that disabling cookies may affect 
              platform functionality.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Data Retention</h2>
            <p className="text-black mb-4">
              We retain information as follows:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Transcripts:</strong> Permanent</li>
              <li><strong>Student Records:</strong> 7 years after last enrollment</li>
              <li><strong>Financial Records:</strong> 7 years</li>
              <li><strong>Application Data:</strong> 2-3 years</li>
              <li><strong>Marketing Data:</strong> Until opt-out + 30 days</li>
            </ul>
            <p className="text-black mb-6">
              See our <a href="/policies/data-retention" className="text-blue-600 hover:underline">Data Retention Policy</a> for details.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Children's Privacy</h2>
            <p className="text-black mb-6">
              Our services are not directed to children under 16. Students aged 16-17 require parental consent 
              for enrollment. We do not knowingly collect information from children under 16 without parental consent.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">International Users</h2>
            <p className="text-black mb-6">
              Our services are based in the United States. If you access from outside the U.S., your information 
              will be transferred to and processed in the U.S. By using our services, you consent to this transfer.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Changes to This Policy</h2>
            <p className="text-black mb-6">
              We may update this Privacy Policy periodically. Material changes will be notified via email or 
              prominent notice on our website. Continued use after changes constitutes acceptance.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Us</h2>
            <p className="text-black mb-4">
              For privacy questions or to exercise your rights:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Privacy Officer:</strong> privacy@www.elevateforhumanity.org</li>
              <li><strong>Phone:</strong> {PLATFORM_DEFAULTS.supportPhone}</li>
              <li><strong>Mail:</strong> Privacy Officer, {PLATFORM_DEFAULTS.orgName}</li>
              <li className="ml-6">123 Main Street</li>
              <li className="ml-6">Indianapolis, IN 46204</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">FERPA Complaints</h3>
            <p className="text-black mb-4">
              To file a FERPA complaint:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Family Policy Compliance Office</strong></li>
              <li>U.S. Department of Education</li>
              <li>400 Maryland Avenue, SW</li>
              <li>Washington, DC 20202-8520</li>
            </ul>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/ferpa" className="text-blue-600 hover:underline">FERPA Policy</a></li>
                <li><a href="/policies/data-retention" className="text-blue-600 hover:underline">Data Retention Policy</a></li>
                <li><a href="/policies/terms" className="text-blue-600 hover:underline">Terms of Service</a></li>
                <li><a href="/policies/acceptable-use" className="text-blue-600 hover:underline">Acceptable Use Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
