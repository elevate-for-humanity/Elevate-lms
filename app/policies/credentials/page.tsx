import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Credentials Policy | Elevate for Humanity',
  description: 'Standards for issuing, verifying, and maintaining certificates, credentials, and certifications.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/credentials',
  },
};

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Credentials" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Credentials Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This policy establishes standards for issuing, verifying, and maintaining credentials earned through 
              Elevate for Humanity programs. We ensure credentials accurately represent student achievement and 
              maintain their value and integrity in the marketplace.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Types of Credentials</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Certificates of Completion</h3>
                <p className="text-black mb-3">
                  Awarded upon successful completion of training programs:
                </p>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>CNA Certificate</li>
                  <li>CDL Certificate</li>
                  <li>Phlebotomy Certificate</li>
                  <li>Tax Preparation Certificate</li>
                  <li>Other program certificates</li>
                </ul>
              </div>

              <div className="bg-brand-green-50 rounded-lg p-6 border-2 border-brand-green-200">
                <h3 className="text-xl font-bold text-black mb-3">Industry Certifications</h3>
                <p className="text-black mb-3">
                  Preparation for external certifications:
                </p>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>State CNA Certification</li>
                  <li>Commercial Driver's License</li>
                  <li>IRS PTIN Certification</li>
                  <li>CompTIA Certifications</li>
                  <li>Industry-specific licenses</li>
                </ul>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Digital Badges</h3>
                <p className="text-black mb-3">
                  Micro-credentials for specific skills:
                </p>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Skill-based badges</li>
                  <li>Course completion badges</li>
                  <li>Professional development</li>
                  <li>Shareable on LinkedIn</li>
                </ul>
              </div>

              <div className="bg-brand-orange-50 rounded-lg p-6 border-2 border-brand-orange-200">
                <h3 className="text-xl font-bold text-black mb-3">Continuing Education</h3>
                <p className="text-black mb-3">
                  CEUs and professional development:
                </p>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Continuing Education Units</li>
                  <li>Professional development hours</li>
                  <li>License renewal credits</li>
                  <li>Workforce training hours</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Requirements for Credential Issuance</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">To Earn a Credential, Students Must:</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Complete all coursework:</strong> Finish all required modules, lessons, and activities</li>
                <li><strong>Pass all assessments:</strong> Achieve minimum passing scores on exams and evaluations</li>
                <li><strong>Meet attendance requirements:</strong> Maintain 80% attendance (or program-specific requirement)</li>
                <li><strong>Complete clinical/practical hours:</strong> Fulfill all hands-on training requirements</li>
                <li><strong>Demonstrate competency:</strong> Pass skills assessments and performance evaluations</li>
                <li><strong>Maintain good standing:</strong> No unresolved academic integrity or conduct violations</li>
                <li><strong>Clear financial obligations:</strong> All tuition and fees paid or payment plan current</li>
                <li><strong>Submit required documentation:</strong> All forms, evaluations, and paperwork completed</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Credential Issuance Process</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Program Completion</h3>
                    <p className="text-black">
                      Student completes all program requirements. Instructor verifies completion and submits 
                      final grades to registrar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Verification</h3>
                    <p className="text-black">
                      Registrar verifies all requirements met, including attendance, assessments, and financial 
                      clearance. Any issues are resolved before proceeding.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Credential Generation</h3>
                    <p className="text-black">
                      Official credential is generated with unique credential ID, student information, program 
                      details, completion date, and authorized signatures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Delivery</h3>
                    <p className="text-black">
                      Credential delivered to student via email (digital) and/or mail (physical). Digital 
                      credentials available immediately; physical certificates within 2-3 weeks.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Record Keeping</h3>
                    <p className="text-black">
                      Credential recorded in permanent student records and verification database. Available 
                      for future verification requests.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Credential Information</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">What's Included on Credentials</h3>
            <p className="text-black mb-4">
              Official credentials include:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Student name (as appears in official records)</li>
              <li>Program or course name</li>
              <li>Completion date</li>
              <li>Unique credential ID number</li>
              <li>Authorized signatures (Director, Registrar)</li>
              <li>Official seal or logo</li>
              <li>Verification URL or QR code (digital credentials)</li>
              <li>Skills or competencies achieved (if applicable)</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Digital vs. Physical Credentials</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-black mb-3">Digital Credentials</h4>
                <ul className="list-disc pl-6 text-black space-y-2">
                  <li>Instant delivery via email</li>
                  <li>Shareable on social media</li>
                  <li>Verifiable via unique URL</li>
                  <li>Cannot be lost or damaged</li>
                  <li>Eco-friendly option</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <h4 className="text-lg font-bold text-black mb-3">Physical Certificates</h4>
                <ul className="list-disc pl-6 text-black space-y-2">
                  <li>Professional printed certificate</li>
                  <li>Suitable for framing</li>
                  <li>Delivered via mail (2-3 weeks)</li>
                  <li>Security features (watermark, seal)</li>
                  <li>Traditional keepsake</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Credential Verification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">For Employers and Institutions</h3>
            <p className="text-black mb-4">
              To verify a credential:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Visit our verification portal: www.elevateforhumanity.org/verify</li>
              <li>Enter the credential ID number</li>
              <li>View credential details and confirmation</li>
              <li>Download verification report if needed</li>
            </ol>
            <p className="text-black mb-6">
              Or contact our registrar office at info@elevateforhumanity.org or (317) 314-3757.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Verification Information Provided</h3>
            <p className="text-black mb-4">
              Verification confirms:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Credential is authentic and issued by us</li>
              <li>Student name and credential details</li>
              <li>Program completed and completion date</li>
              <li>Credential status (active, revoked, expired)</li>
              <li>Skills or competencies certified</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Replacement Credentials</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Requesting Replacements</h3>
            <p className="text-black mb-4">
              If your credential is lost, damaged, or you need additional copies:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Submit request through student portal or email registrar</li>
              <li>Provide your name, program, and completion date</li>
              <li>Pay replacement fee ($25 for physical, $10 for digital)</li>
              <li>Allow 2-3 weeks for physical certificate delivery</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Name Changes</h3>
            <p className="text-black mb-6">
              To update your name on a credential due to marriage, divorce, or legal name change:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Submit official documentation (marriage certificate, court order, etc.)</li>
              <li>Complete name change request form</li>
              <li>Pay processing fee ($15)</li>
              <li>Receive updated credential within 2-3 weeks</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Credential Revocation</h2>
            
            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Grounds for Revocation</h3>
              <p className="text-black mb-2">Credentials may be revoked if:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Credential was obtained through fraud or misrepresentation</li>
                <li>Academic integrity violations discovered after issuance</li>
                <li>Required documentation was falsified</li>
                <li>Student did not actually meet completion requirements</li>
                <li>Serious misconduct discovered after graduation</li>
                <li>Credential was issued in error</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Revocation Process</h3>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Investigation of alleged grounds for revocation</li>
              <li>Written notification to credential holder</li>
              <li>Opportunity to respond (10 business days)</li>
              <li>Review by Credentials Committee</li>
              <li>Final decision and notification</li>
              <li>Credential marked as revoked in verification system</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Credential Maintenance</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Continuing Education Requirements</h3>
            <p className="text-black mb-6">
              Some credentials require ongoing education to maintain validity. Check your specific program 
              requirements. We offer continuing education courses to help you maintain certifications.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Credential Expiration</h3>
            <p className="text-black mb-6">
              Most Elevate for Humanity certificates do not expire. However, industry certifications and 
              licenses may have expiration dates set by certifying bodies. You are responsible for maintaining 
              external certifications.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Transcript Services</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Official Transcripts</h3>
            <p className="text-black mb-4">
              Request official transcripts showing all completed programs:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Order through student portal or registrar office</li>
              <li>$10 per transcript (digital or physical)</li>
              <li>Sent directly to employer or institution</li>
              <li>Includes all programs, grades, and credentials earned</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For credential questions or services:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Verification Portal:</strong> www.elevateforhumanity.org/verify</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/progress" className="text-brand-blue-600 hover:underline">Progress Policy</a></li>
                <li><a href="/policies/revocation" className="text-brand-blue-600 hover:underline">Revocation Policy</a></li>
                <li><a href="/policies/verification" className="text-brand-blue-600 hover:underline">Verification Policy</a></li>
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
