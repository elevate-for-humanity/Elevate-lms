
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Credential Revocation Policy | Elevate for Humanity',
  description: 'Conditions under which credentials may be revoked, revocation procedures, and appeal rights.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/revocation',
  },
};

export default function RevocationPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Revocation" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Credential Revocation Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This policy establishes the conditions under which Elevate for Humanity may revoke credentials 
              previously awarded to students. Revocation is a serious action taken only when necessary to protect 
              the integrity of our credentials and the interests of employers, students, and the public.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Grounds for Revocation</h2>
            
            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Fraud or Misrepresentation</h3>
              <p className="text-black mb-2">Credentials may be revoked if obtained through:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Falsified application materials or documentation</li>
                <li>Fraudulent identity or credentials</li>
                <li>Misrepresentation of qualifications or experience</li>
                <li>Forged signatures or official documents</li>
                <li>Impersonation during assessments or coursework</li>
                <li>Payment fraud or stolen financial information</li>
              </ul>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Academic Dishonesty</h3>
              <p className="text-black mb-2">Discovered after credential issuance:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Plagiarism or cheating on major assessments</li>
                <li>Fabrication of clinical hours or practical experience</li>
                <li>Unauthorized collaboration on individual work</li>
                <li>Purchase of assignments or exam answers</li>
                <li>Systematic academic integrity violations</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Failure to Meet Requirements</h3>
              <p className="text-black mb-2">Credential issued in error when student:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Did not actually complete all program requirements</li>
                <li>Failed to meet attendance standards</li>
                <li>Did not pass required assessments</li>
                <li>Lacked prerequisite qualifications</li>
                <li>Had unresolved disciplinary issues</li>
              </ul>
            </div>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Serious Misconduct</h3>
              <p className="text-black mb-2">Discovered after graduation:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Criminal activity during enrollment period</li>
                <li>Serious violations of student code of conduct</li>
                <li>Harassment, discrimination, or violence</li>
                <li>Theft or destruction of institutional property</li>
                <li>Conduct that brings disrepute to the institution</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Revocation Process</h2>
            
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Allegation Received</h3>
                    <p className="text-black">
                      Report or discovery of potential grounds for revocation. Initial review determines if 
                      investigation is warranted.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Investigation</h3>
                    <p className="text-black">
                      Registrar or designated official investigates allegations. Gathers evidence, interviews 
                      witnesses, reviews records. Investigation conducted confidentially.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Written Notice</h3>
                    <p className="text-black">
                      If evidence supports revocation, credential holder receives written notice including:
                    </p>
                    <ul className="list-disc pl-6 text-black mt-2 space-y-1">
                      <li>Specific allegations and evidence</li>
                      <li>Proposed revocation action</li>
                      <li>Right to respond</li>
                      <li>Response deadline (10 business days)</li>
                      <li>Appeal rights and procedures</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Opportunity to Respond</h3>
                    <p className="text-black">
                      Credential holder may submit written response with:
                    </p>
                    <ul className="list-disc pl-6 text-black mt-2 space-y-1">
                      <li>Explanation of circumstances</li>
                      <li>Evidence refuting allegations</li>
                      <li>Mitigating factors</li>
                      <li>Witness statements</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Review and Decision</h3>
                    <p className="text-black">
                      Credentials Review Committee evaluates all evidence and response. Makes final determination 
                      on revocation. Decision communicated in writing within 15 business days.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    6
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Implementation</h3>
                    <p className="text-black">
                      If revocation upheld:
                    </p>
                    <ul className="list-disc pl-6 text-black mt-2 space-y-1">
                      <li>Credential marked as revoked in verification system</li>
                      <li>Notation added to permanent record</li>
                      <li>Physical credential must be returned</li>
                      <li>Digital credentials deactivated</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences of Revocation</h2>
            
            <div className="bg-brand-red-50 rounded-xl p-6 border-2 border-brand-red-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">When Credential is Revoked:</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Credential Invalidated:</strong> No longer valid for employment or professional purposes</li>
                <li><strong>Verification Updated:</strong> Verification system shows credential as revoked</li>
                <li><strong>Transcript Notation:</strong> Permanent notation on academic transcript</li>
                <li><strong>No Refund:</strong> Tuition and fees are not refunded</li>
                <li><strong>Return Required:</strong> Physical certificates must be returned within 30 days</li>
                <li><strong>Future Enrollment:</strong> May be ineligible for future enrollment</li>
                <li><strong>Employer Notification:</strong> Current employer may be notified (if known)</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeal Rights</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Grounds for Appeal</h3>
            <p className="text-black mb-4">
              Appeals may be filed based on:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Procedural errors that affected the outcome</li>
              <li>New evidence not available during initial review</li>
              <li>Evidence that allegations are unfounded</li>
              <li>Disproportionate sanction for the violation</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Appeal Process</h3>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written appeal within 10 business days of revocation decision</li>
              <li>Include specific grounds for appeal and supporting evidence</li>
              <li>Appeal reviewed by independent Appeals Committee</li>
              <li>Committee may request additional information or hearing</li>
              <li>Decision rendered within 20 business days</li>
              <li>Appeals Committee decision is final</li>
            </ol>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Appeal Outcomes</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Revocation Upheld:</strong> Original decision stands</li>
              <li><strong>Revocation Overturned:</strong> Credential reinstated</li>
              <li><strong>Modified Sanction:</strong> Alternative consequence imposed</li>
              <li><strong>Remanded:</strong> Sent back for additional review</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reinstatement</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Eligibility for Reinstatement</h3>
            <p className="text-black mb-4">
              In rare cases, revoked credentials may be reinstated if:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Revocation was based on incorrect information</li>
              <li>New evidence exonerates the credential holder</li>
              <li>Credential holder successfully appeals</li>
              <li>Extraordinary circumstances warrant reconsideration</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Reinstatement Process</h3>
            <p className="text-black mb-4">
              To request reinstatement:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written petition explaining basis for reinstatement</li>
              <li>Provide supporting documentation</li>
              <li>Petition reviewed by Credentials Review Committee</li>
              <li>Decision rendered within 30 business days</li>
              <li>If approved, credential reissued with notation of revocation and reinstatement</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting and Notification</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Who is Notified</h3>
            <p className="text-black mb-4">
              When credential is revoked, notification may be sent to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Current employer (if known and relevant)</li>
              <li>Licensing boards (if applicable)</li>
              <li>Accrediting agencies (if required)</li>
              <li>Law enforcement (if criminal activity involved)</li>
              <li>Other institutions (if requested for verification)</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Verification Inquiries</h3>
            <p className="text-black mb-6">
              When employers or others verify credentials, revoked status is disclosed along with:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Date credential was originally issued</li>
              <li>Date of revocation</li>
              <li>General reason for revocation (without details)</li>
              <li>Current status (revoked, not valid)</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prevention</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Protecting Your Credential</h3>
            <p className="text-black mb-4">
              To avoid revocation:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Provide accurate information throughout enrollment</li>
              <li>Complete all work honestly and with integrity</li>
              <li>Follow all academic and conduct policies</li>
              <li>Report any errors or issues promptly</li>
              <li>Maintain professional standards after graduation</li>
              <li>Use credentials appropriately and honestly</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions about credential revocation:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Appeals:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/credentials" className="text-brand-blue-600 hover:underline">Credentials Policy</a></li>
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/policies/verification" className="text-brand-blue-600 hover:underline">Verification Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
