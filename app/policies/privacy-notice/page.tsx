export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Notice | Elevate for Humanity',
  description: 'Privacy notice for Elevate for Humanity learners, partners, and visitors. Learn how we collect, use, protect, and share your personal information.',
  keywords: ['privacy notice', 'data collection', 'personal information', 'data protection', 'privacy rights', 'FERPA', 'GDPR', 'CCPA'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/privacy-notice',
  },
};

export default function PrivacyNoticePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Privacy Notice' }]} />
        <article className="prose prose-lg max-w-none mt-6">
      <h1>Privacy Notice</h1>
      <p className="text-xl text-gray-600 mb-8">Last Updated: December 22, 2024</p>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <p className="text-lg font-semibold text-blue-900 mb-2">Your Privacy Matters</p>
        <p className="text-blue-800">
          Elevate for Humanity is committed to protecting your privacy and handling your personal information 
          with care and transparency. This notice explains what information we collect, how we use it, and your rights.
        </p>
      </div>

      <section className="mb-12">
        <h2>Purpose of This Notice</h2>
        <p>
          This Privacy Notice describes how Elevate for Humanity ("we," "us," or "our") collects, uses, 
          discloses, and protects personal information from:
        </p>
        <ul>
          <li><strong>Learners:</strong> Students enrolled in our programs</li>
          <li><strong>Prospective Learners:</strong> Individuals inquiring about our programs</li>
          <li><strong>Partners:</strong> Employers, instructors, and organizational partners</li>
          <li><strong>Visitors:</strong> Users of our website and platforms</li>
        </ul>
        <p>
          This notice supplements our comprehensive <Link href="/policies/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link> and 
          provides specific information about data practices.
        </p>
      </section>

      <section className="mb-12">
        <h2>Information We Collect</h2>
        
        <h3>Personal Identification Information</h3>
        <ul>
          <li>Full legal name and preferred name</li>
          <li>Date of birth and age verification</li>
          <li>Social Security Number (for federal compliance and funding)</li>
          <li>Government-issued ID information</li>
          <li>Citizenship and immigration status (when required)</li>
          <li>Demographic information (race, ethnicity, gender - optional)</li>
        </ul>

        <h3>Contact Information</h3>
        <ul>
          <li>Email address (primary and alternate)</li>
          <li>Phone numbers (mobile and home)</li>
          <li>Mailing address and physical address</li>
          <li>Emergency contact information</li>
        </ul>

        <h3>Educational Information</h3>
        <ul>
          <li>Prior education history and transcripts</li>
          <li>Enrollment status and program selection</li>
          <li>Course registrations and schedules</li>
          <li>Academic performance and grades</li>
          <li>Attendance records</li>
          <li>Assignment submissions and assessments</li>
          <li>Certificates and credentials earned</li>
          <li>Academic integrity records</li>
        </ul>

        <h3>Employment and Career Information</h3>
        <ul>
          <li>Employment history and status</li>
          <li>Income information (for funding eligibility)</li>
          <li>Career goals and interests</li>
          <li>Resume and portfolio materials</li>
          <li>Job placement outcomes</li>
        </ul>

        <h3>Financial Information</h3>
        <ul>
          <li>Payment information (processed securely by third parties)</li>
          <li>Financial aid and scholarship applications</li>
          <li>Grant funding documentation</li>
          <li>Income verification documents</li>
          <li>Tax information (when required for funding)</li>
        </ul>

        <h3>Technical Information</h3>
        <ul>
          <li>IP address and device information</li>
          <li>Browser type and version</li>
          <li>Operating system</li>
          <li>Login credentials (encrypted)</li>
          <li>Platform usage data and analytics</li>
          <li>Cookies and tracking technologies</li>
        </ul>

        <h3>Communications</h3>
        <ul>
          <li>Email correspondence</li>
          <li>Chat and messaging history</li>
          <li>Support ticket information</li>
          <li>Survey responses and feedback</li>
          <li>Forum and discussion posts</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>How We Collect Information</h2>
        
        <h3>Direct Collection</h3>
        <ul>
          <li><strong>Application Forms:</strong> Information you provide when applying to programs</li>
          <li><strong>Enrollment Process:</strong> Data collected during registration and onboarding</li>
          <li><strong>Account Creation:</strong> Information provided when creating user accounts</li>
          <li><strong>Course Activities:</strong> Data from assignments, assessments, and participation</li>
          <li><strong>Communications:</strong> Information from emails, chats, and support requests</li>
        </ul>

        <h3>Automated Collection</h3>
        <ul>
          <li><strong>Platform Usage:</strong> Automatic logging of system interactions</li>
          <li><strong>Cookies:</strong> Browser cookies for functionality and analytics</li>
          <li><strong>Analytics Tools:</strong> Usage patterns and performance metrics</li>
          <li><strong>Learning Management System:</strong> Course progress and engagement data</li>
        </ul>

        <h3>Third-Party Sources</h3>
        <ul>
          <li><strong>Educational Institutions:</strong> Transcripts and verification</li>
          <li><strong>Employers:</strong> Employment verification and referrals</li>
          <li><strong>Government Agencies:</strong> Eligibility verification for funding programs</li>
          <li><strong>Background Check Providers:</strong> When required for program participation</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>How We Use Your Information</h2>
        
        <h3>Educational Services</h3>
        <ul>
          <li>Process applications and enrollment</li>
          <li>Deliver instruction and educational content</li>
          <li>Assess learning and provide feedback</li>
          <li>Issue certificates and credentials</li>
          <li>Provide academic advising and support</li>
          <li>Track progress and completion</li>
        </ul>

        <h3>Administrative Operations</h3>
        <ul>
          <li>Manage student records and accounts</li>
          <li>Process payments and financial aid</li>
          <li>Maintain attendance records</li>
          <li>Enforce policies and code of conduct</li>
          <li>Respond to inquiries and support requests</li>
          <li>Conduct surveys and quality improvement</li>
        </ul>

        <h3>Legal and Compliance</h3>
        <ul>
          <li>Comply with federal and state education regulations</li>
          <li>Meet FERPA, WIOA, and other statutory requirements</li>
          <li>Report to funding agencies and accreditors</li>
          <li>Verify eligibility for programs and funding</li>
          <li>Maintain required records and documentation</li>
          <li>Respond to legal requests and subpoenas</li>
        </ul>

        <h3>Communications</h3>
        <ul>
          <li>Send course announcements and updates</li>
          <li>Provide program information and reminders</li>
          <li>Share career opportunities and resources</li>
          <li>Deliver marketing communications (with consent)</li>
          <li>Send administrative notifications</li>
        </ul>

        <h3>Platform Improvement</h3>
        <ul>
          <li>Analyze usage patterns and performance</li>
          <li>Improve user experience and functionality</li>
          <li>Develop new features and services</li>
          <li>Conduct research and analytics</li>
          <li>Ensure security and prevent fraud</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>How We Share Your Information</h2>
        
        <h3>With Your Consent</h3>
        <p>
          We share information when you explicitly authorize us to do so, such as:
        </p>
        <ul>
          <li>Sharing credentials with employers</li>
          <li>Providing references or recommendations</li>
          <li>Connecting you with career services partners</li>
          <li>Participating in research studies</li>
        </ul>

        <h3>Service Providers</h3>
        <p>
          We share information with trusted third-party service providers who assist with:
        </p>
        <ul>
          <li>Learning management system hosting</li>
          <li>Payment processing</li>
          <li>Email and communication services</li>
          <li>Analytics and performance monitoring</li>
          <li>Customer support tools</li>
          <li>Background check services</li>
        </ul>
        <p>
          All service providers are contractually required to protect your information and use it only 
          for specified purposes.
        </p>

        <h3>Educational Partners</h3>
        <ul>
          <li><strong>Instructors:</strong> Course-related information for teaching purposes</li>
          <li><strong>Employers:</strong> Program completion and credential verification (with consent)</li>
          <li><strong>Partner Organizations:</strong> Referral and co-enrollment information</li>
        </ul>

        <h3>Government Agencies</h3>
        <p>
          We share information as required by law with:
        </p>
        <ul>
          <li>Department of Labor (for WIOA reporting)</li>
          <li>Department of Education (for compliance)</li>
          <li>State workforce agencies (for funding programs)</li>
          <li>IRS (for tax reporting)</li>
          <li>Other agencies as legally required</li>
        </ul>

        <h3>Legal Requirements</h3>
        <p>
          We may disclose information when required to:
        </p>
        <ul>
          <li>Comply with court orders or subpoenas</li>
          <li>Respond to lawful requests from authorities</li>
          <li>Protect our rights and property</li>
          <li>Prevent fraud or security threats</li>
          <li>Protect the safety of individuals</li>
        </ul>

        <h3>Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, or sale of assets, your information may be transferred 
          to the acquiring entity, subject to the same privacy protections.
        </p>
      </section>

      <section className="mb-12">
        <h2>Data Protection and Security</h2>
        
        <h3>Security Measures</h3>
        <ul>
          <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest</li>
          <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
          <li><strong>Monitoring:</strong> Continuous security monitoring and threat detection</li>
          <li><strong>Audits:</strong> Regular security assessments and penetration testing</li>
          <li><strong>Training:</strong> Staff trained on data protection and privacy practices</li>
          <li><strong>Incident Response:</strong> Procedures for detecting and responding to breaches</li>
        </ul>

        <h3>Data Retention</h3>
        <p>
          We retain your information for as long as necessary to:
        </p>
        <ul>
          <li>Provide educational services</li>
          <li>Maintain academic records (permanent for transcripts)</li>
          <li>Comply with legal and regulatory requirements</li>
          <li>Resolve disputes and enforce agreements</li>
        </ul>
        <p>
          See our <Link href="/policies/data-retention" className="text-blue-600 hover:text-blue-800">Data Retention Policy</Link> for 
          specific retention periods.
        </p>

        <h3>Data Minimization</h3>
        <p>
          We collect only the information necessary for legitimate educational and operational purposes. 
          We regularly review data holdings and delete information that is no longer needed.
        </p>
      </section>

      <section className="mb-12">
        <h2>Your Privacy Rights</h2>
        
        <h3>FERPA Rights (Students)</h3>
        <p>
          Under the Family Educational Rights and Privacy Act (FERPA), eligible students have the right to:
        </p>
        <ul>
          <li>Inspect and review their education records</li>
          <li>Request amendments to inaccurate records</li>
          <li>Control disclosure of education records</li>
          <li>File complaints with the Department of Education</li>
        </ul>
        <p>
          See our <Link href="/policies/ferpa" className="text-blue-600 hover:text-blue-800">FERPA Policy</Link> for details.
        </p>

        <h3>General Privacy Rights</h3>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal information</li>
          <li><strong>Correction:</strong> Request correction of inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of information (subject to retention requirements)</li>
          <li><strong>Portability:</strong> Receive your information in a portable format</li>
          <li><strong>Opt-Out:</strong> Opt out of marketing communications</li>
          <li><strong>Restriction:</strong> Request restrictions on processing</li>
        </ul>

        <h3>State-Specific Rights</h3>
        <p>
          Residents of certain states have additional rights:
        </p>
        <ul>
          <li><strong>California (CCPA/CPRA):</strong> Right to know, delete, and opt-out of sale</li>
          <li><strong>Virginia (VCDPA):</strong> Right to access, correct, delete, and opt-out</li>
          <li><strong>Colorado (CPA):</strong> Right to access, correct, delete, and opt-out</li>
          <li><strong>Connecticut (CTDPA):</strong> Right to access, correct, delete, and opt-out</li>
        </ul>

        <h3>Exercising Your Rights</h3>
        <p>
          To exercise your privacy rights:
        </p>
        <ol>
          <li>Submit a request to elevate4humanityedu@gmail.com</li>
          <li>Verify your identity (for security purposes)</li>
          <li>Specify the right you wish to exercise</li>
          <li>We will respond within 30 days (or as required by law)</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2>Cookies and Tracking Technologies</h2>
        
        <h3>Types of Cookies We Use</h3>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
          <li><strong>Performance Cookies:</strong> Analyze usage and improve performance</li>
          <li><strong>Functional Cookies:</strong> Remember preferences and settings</li>
          <li><strong>Analytics Cookies:</strong> Understand user behavior and engagement</li>
        </ul>

        <h3>Managing Cookies</h3>
        <p>
          You can control cookies through your browser settings. Note that disabling certain cookies 
          may affect platform functionality.
        </p>

        <h3>Do Not Track</h3>
        <p>
          We respect Do Not Track signals and do not track users across third-party websites.
        </p>
      </section>

      <section className="mb-12">
        <h2>Children's Privacy</h2>
        <p>
          Our services are not directed to children under 13. We do not knowingly collect information 
          from children under 13. If we learn we have collected such information, we will delete it promptly.
        </p>
        <p>
          For learners aged 13-17, we require parental consent for enrollment and comply with applicable 
          laws regarding minors' privacy.
        </p>
      </section>

      <section className="mb-12">
        <h2>International Data Transfers</h2>
        <p>
          Our services are based in the United States. If you access our services from outside the U.S., 
          your information will be transferred to and processed in the United States.
        </p>
        <p>
          We comply with applicable data protection laws and implement appropriate safeguards for 
          international transfers, including:
        </p>
        <ul>
          <li>Standard contractual clauses</li>
          <li>Data protection agreements</li>
          <li>Adequate security measures</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Changes to This Notice</h2>
        <p>
          We may update this Privacy Notice periodically to reflect changes in our practices or legal 
          requirements. We will:
        </p>
        <ul>
          <li>Post the updated notice on our website</li>
          <li>Update the "Last Updated" date</li>
          <li>Notify users of material changes via email</li>
          <li>Obtain consent for material changes when required</li>
        </ul>
        <p>
          We encourage you to review this notice periodically to stay informed about how we protect 
          your information.
        </p>
      </section>

      <section className="mb-12">
        <h2>Contact Information</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="mt-0">Privacy Office</h3>
          <p className="mb-2">
            <strong>Email:</strong>{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:text-blue-800">
              elevate4humanityedu@gmail.com
            </a>
          </p>
          <p className="mb-2">
            <strong>Phone:</strong>{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:text-blue-800">
              (317) 314-3757
            </a>
          </p>
          <p className="mb-2">
            <strong>Mail:</strong><br />
            Elevate for Humanity<br />
            Privacy Office<br />
            [Address]<br />
            Indianapolis, IN [ZIP]
          </p>
        </div>

        <h3>Data Protection Officer</h3>
        <p>
          For questions about data protection and privacy compliance, contact our Data Protection Officer at{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:text-blue-800">
            elevate4humanityedu@gmail.com
          </a>
        </p>

        <h3>Regulatory Complaints</h3>
        <p>
          If you believe your privacy rights have been violated, you may file a complaint with:
        </p>
        <ul>
          <li>
            <strong>FERPA Complaints:</strong> Family Policy Compliance Office, U.S. Department of Education
          </li>
          <li>
            <strong>State Privacy Complaints:</strong> Your state's Attorney General office
          </li>
          <li>
            <strong>Federal Trade Commission:</strong> For general privacy concerns
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Related Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/policies/privacy" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Privacy Policy</h3>
            <p className="text-blue-800 text-sm mb-0">Comprehensive privacy policy and practices</p>
          </Link>
          <Link href="/policies/ferpa" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">FERPA Policy</h3>
            <p className="text-blue-800 text-sm mb-0">Student education records privacy rights</p>
          </Link>
          <Link href="/policies/data-retention" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Data Retention Policy</h3>
            <p className="text-blue-800 text-sm mb-0">How long we keep your information</p>
          </Link>
          <Link href="/policies/acceptable-use" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Acceptable Use Policy</h3>
            <p className="text-blue-800 text-sm mb-0">Guidelines for using our platforms</p>
          </Link>
        </div>
      </section>

      <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-8">
        <p className="text-lg font-semibold text-green-900 mb-2">Questions About Your Privacy?</p>
        <p className="text-green-800 mb-0">
          We're here to help. Contact our Privacy Office at{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-green-900 font-semibold hover:underline">
            elevate4humanityedu@gmail.com
          </a>{' '}
          or call{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-green-900 font-semibold hover:underline">
            (317) 314-3757
          </a>.
        </p>
      </div>
        </article>
      </div>
    </div>
  );
}
