
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admissions Policy | Elevate for Humanity',
  description: 'Requirements, procedures, and guidelines for program enrollment and admission to Elevate for Humanity training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/admissions',
  },
};

export default function AdmissionsPage() {

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Admissions" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Admissions Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Admissions Policy outlines the requirements, procedures, and guidelines for enrollment in 
              Elevate for Humanity training programs. We are committed to providing equal access to education 
              while ensuring students are prepared for success in their chosen programs.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Non-Discrimination Statement</h2>
            <p className="text-black mb-6">
              Elevate for Humanity does not discriminate on the basis of race, color, national origin, sex, 
              disability, age, religion, sexual orientation, gender identity, veteran status, or any other 
              protected characteristic. We provide equal access to programs, services, and employment opportunities.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">General Admission Requirements</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Basic Requirements</h3>
              <p className="text-black mb-4">All applicants must meet the following:</p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Age:</strong> 18 years or older (16-17 with parental consent for select programs)</li>
                <li><strong>Education:</strong> High school diploma, GED, or equivalent</li>
                <li><strong>Identification:</strong> Valid government-issued photo ID</li>
                <li><strong>Eligibility:</strong> Eligible to work in the United States</li>
                <li><strong>Funding:</strong> Verified funding source or payment plan</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Program-Specific Requirements</h3>
            <p className="text-black mb-4">Some programs have additional requirements:</p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <h4 className="font-bold text-black mb-2">Healthcare Programs (CNA, Phlebotomy, etc.)</h4>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Background check (no disqualifying offenses)</li>
                  <li>Drug screening</li>
                  <li>TB test and immunization records</li>
                  <li>Physical examination (some programs)</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <h4 className="font-bold text-black mb-2">CDL/Transportation Programs</h4>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Valid driver's license</li>
                  <li>DOT physical examination</li>
                  <li>Clean driving record (no major violations)</li>
                  <li>Drug and alcohol screening</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <h4 className="font-bold text-black mb-2">Skilled Trades Programs</h4>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Physical ability to perform trade tasks</li>
                  <li>Basic math and measurement skills</li>
                  <li>Safety equipment (steel-toed boots, etc.)</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Admission Process</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Submit Application</h3>
                    <p className="text-black mb-2">
                      Complete the online application or visit our office to apply in person. Provide:
                    </p>
                    <ul className="list-disc pl-6 text-black space-y-1">
                      <li>Personal information and contact details</li>
                      <li>Educational background</li>
                      <li>Program of interest</li>
                      <li>Funding source information</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Document Submission</h3>
                    <p className="text-black mb-2">
                      Submit required documentation:
                    </p>
                    <ul className="list-disc pl-6 text-black space-y-1">
                      <li>Copy of high school diploma or GED</li>
                      <li>Government-issued photo ID</li>
                      <li>Social Security number (entered securely online) or work authorization</li>
                      <li>Proof of funding eligibility (WIOA, WRG, employer sponsorship, or self-pay)</li>
                      <li>Program-specific documents (if applicable)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Advisor Interview</h3>
                    <p className="text-black mb-2">
                      Meet with an admissions advisor to:
                    </p>
                    <ul className="list-disc pl-6 text-black space-y-1">
                      <li>Discuss your career goals and program fit</li>
                      <li>Review program requirements and expectations</li>
                      <li>Explore workforce funding options</li>
                      <li>Answer questions about the program</li>
                      <li>Complete any required assessments</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Funding Verification</h3>
                    <p className="text-black mb-2">
                      Confirm your funding source:
                    </p>
                    <ul className="list-disc pl-6 text-black space-y-1">
                      <li>WIOA approval and eligibility letter</li>
                      <li>Vocational Rehabilitation authorization</li>
                      <li>Employer sponsorship documentation</li>
                      <li>Private payment or payment plan setup</li>
                      <li>Grant or scholarship award letters</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Enrollment</h3>
                    <p className="text-black mb-2">
                      Once approved:
                    </p>
                    <ul className="list-disc pl-6 text-black space-y-1">
                      <li>Receive acceptance notification</li>
                      <li>Complete enrollment paperwork</li>
                      <li>Attend orientation session</li>
                      <li>Receive class schedule and materials list</li>
                      <li>Begin classes on your start date</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Application Timeline</h2>
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <ul className="space-y-3 text-black">
                <li><strong>Application Review:</strong> 1-3 business days</li>
                <li><strong>Document Verification:</strong> 2-5 business days</li>
                <li><strong>Advisor Interview:</strong> Scheduled within 1 week of application</li>
                <li><strong>Funding Verification:</strong> 1-2 weeks (varies by funding source)</li>
                <li><strong>Enrollment Decision:</strong> Within 2 weeks of complete application</li>
                <li><strong>Start Date:</strong> Next available class start (typically 2-4 weeks)</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Funding Options</h2>
            <p className="text-black mb-4">We accept various funding sources:</p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-brand-green-50 rounded-lg p-6 border-2 border-brand-green-200">
                <h3 className="text-lg font-bold text-black mb-3">Government Programs</h3>
                <ul className="list-disc pl-6 text-black space-y-2">
                  <li>WIOA (Workforce Innovation and Opportunity Act)</li>
                  <li>Vocational Rehabilitation</li>
                  <li>TANF (Temporary Assistance for Needy Families)</li>
                  <li>Veterans benefits (GI Bill, VR&E)</li>
                  <li>Trade Adjustment Assistance</li>
                </ul>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-lg font-bold text-black mb-3">Other Options</h3>
                <ul className="list-disc pl-6 text-black space-y-2">
                  <li>Employer sponsorship</li>
                  <li>Private payment</li>
                  <li>Payment plans (interest-free)</li>
                  <li>Scholarships and grants</li>
                  <li>Third-party billing</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Special Admissions</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Justice-Involved Individuals</h3>
            <p className="text-black mb-4">
              We welcome applications from justice-involved individuals. Some programs may have restrictions 
              based on the nature of convictions (particularly healthcare and positions working with vulnerable 
              populations). We evaluate each application individually and work with applicants to find suitable 
              program options.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">International Students</h3>
            <p className="text-black mb-4">
              International students must provide:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Valid visa and work authorization</li>
              <li>Credential evaluation for foreign diplomas</li>
              <li>English proficiency demonstration (if applicable)</li>
              <li>Additional documentation as required by program</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Students with Disabilities</h3>
            <p className="text-black mb-6">
              We provide reasonable accommodations for students with disabilities. Contact our Disability 
              Services office during the application process to discuss needed accommodations. Documentation 
              of disability may be required for certain accommodations.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Denial and Appeals</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Reasons for Denial</h3>
              <p className="text-black mb-2">Applications may be denied for:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Incomplete application or missing documents</li>
                <li>Failure to meet program-specific requirements</li>
                <li>Disqualifying background check results (healthcare programs)</li>
                <li>Lack of verified funding</li>
                <li>Program capacity limitations</li>
                <li>Previous dismissal for academic or conduct violations</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Appeal Process</h3>
            <p className="text-black mb-4">
              If your application is denied, you may appeal:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written appeal within 10 business days of denial notification</li>
              <li>Include explanation and any additional supporting documentation</li>
              <li>Appeal reviewed by Admissions Committee</li>
              <li>Decision rendered within 15 business days</li>
              <li>Committee decision is final</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Re-Application</h2>
            <p className="text-black mb-6">
              Denied applicants may re-apply after addressing the reasons for denial. There is no waiting 
              period for re-application unless specified in the denial letter. Contact admissions to discuss 
              steps needed for successful re-application.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Admissions</h2>
            <p className="text-black mb-4">
              For questions about admissions or to start your application:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a></li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 8:00 AM - 6:00 PM EST</li>
              <li><strong>Location:</strong> 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</li>
              <li><strong>Apply Online:</strong> <a href="/apply" className="text-brand-blue-600 hover:underline">www.elevateforhumanity.org/apply</a></li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/funding-verification" className="text-brand-blue-600 hover:underline">Funding Verification Policy</a></li>
                <li><a href="/policies/verification" className="text-brand-blue-600 hover:underline">Identity Verification Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/policies/progress" className="text-brand-blue-600 hover:underline">Progress Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
