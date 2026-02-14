import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Grant Application Policy | Elevate for Humanity',
  description: 'Process and requirements for applying for grants and external funding opportunities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/grant-application',
  },
};

export default function GrantApplicationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Grant Application" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Grant Application Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 12, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This policy establishes procedures for identifying, applying for, and managing grants and external 
              funding opportunities. Grants support program development, student services, facilities, and 
              institutional growth while ensuring compliance with funder requirements.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Types of Grants</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Federal Grants</h3>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Department of Education</li>
                  <li>Department of Labor</li>
                  <li>National Science Foundation</li>
                  <li>Other federal agencies</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-black mb-3">State Grants</h3>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>State education departments</li>
                  <li>Workforce development boards</li>
                  <li>Economic development agencies</li>
                  <li>State foundations</li>
                </ul>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Private Foundations</h3>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>National foundations</li>
                  <li>Community foundations</li>
                  <li>Corporate foundations</li>
                  <li>Family foundations</li>
                </ul>
              </div>

              <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
                <h3 className="text-xl font-bold text-black mb-3">Corporate Grants</h3>
                <ul className="list-disc pl-6 text-black space-y-1">
                  <li>Corporate giving programs</li>
                  <li>Industry partnerships</li>
                  <li>Sponsorships</li>
                  <li>In-kind donations</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Grant Application Process</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Opportunity Identification</h3>
                    <p className="text-black">
                      Grants office monitors funding opportunities and alerts relevant departments. Staff may 
                      also identify opportunities aligned with institutional priorities.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Eligibility Assessment</h3>
                    <p className="text-black">
                      Review eligibility criteria, funding priorities, and alignment with institutional mission. 
                      Assess capacity to meet requirements and manage grant if awarded.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Concept Development</h3>
                    <p className="text-black">
                      Develop project concept, goals, activities, and budget. Consult with stakeholders and 
                      subject matter experts. Submit concept for internal approval.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Application Preparation</h3>
                    <p className="text-black">
                      Write proposal narrative, develop detailed budget, gather supporting documents, and 
                      complete all required forms. Allow time for internal review and revisions.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Submission</h3>
                    <p className="text-black">
                      Submit complete application by deadline through required portal or method. Retain 
                      confirmation of submission and all application materials.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Application Requirements</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Standard Components</h3>
            <p className="text-black mb-4">
              Most grant applications require:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Cover Letter:</strong> Introduction and summary of request</li>
              <li><strong>Proposal Narrative:</strong> Detailed project description, goals, methods, evaluation</li>
              <li><strong>Budget:</strong> Detailed line-item budget with justification</li>
              <li><strong>Organizational Information:</strong> Mission, history, capacity, governance</li>
              <li><strong>Supporting Documents:</strong> IRS determination letter, audited financials, etc.</li>
              <li><strong>Letters of Support:</strong> From partners, community members, stakeholders</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Institutional Documents</h3>
            <p className="text-black mb-4">
              Maintained by grants office:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>501(c)(3) tax-exempt status letter</li>
              <li>Annual audited financial statements</li>
              <li>Board of Directors list</li>
              <li>Organizational chart</li>
              <li>Strategic plan</li>
              <li>Accreditation documentation</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Internal Approval</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Approval Requirements</h3>
            <p className="text-black mb-4">
              All grant applications require approval from:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Department Head:</strong> For departmental projects</li>
              <li><strong>Grants Director:</strong> For budget and compliance review</li>
              <li><strong>Finance Director:</strong> For financial commitments</li>
              <li><strong>Executive Director:</strong> For grants over $50,000 or multi-year commitments</li>
              <li><strong>Board of Directors:</strong> For grants over $250,000</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Timeline</h3>
            <p className="text-black mb-6">
              Submit for internal approval at least 2 weeks before grant deadline to allow adequate review time.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Grant Management</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">If Awarded</h3>
            <p className="text-black mb-4">
              Upon grant award:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Review and sign grant agreement</li>
              <li>Set up grant accounting and tracking systems</li>
              <li>Establish project timeline and milestones</li>
              <li>Assign project manager and team</li>
              <li>Schedule kickoff meeting with stakeholders</li>
              <li>Implement reporting and compliance procedures</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Ongoing Responsibilities</h3>
            <p className="text-black mb-4">
              Grant recipients must:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Implement project as proposed</li>
              <li>Track expenses and maintain documentation</li>
              <li>Submit required reports on time</li>
              <li>Comply with all grant terms and conditions</li>
              <li>Notify funder of significant changes</li>
              <li>Participate in site visits or evaluations</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Compliance</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Financial Compliance</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Spend funds only on approved budget items</li>
              <li>Maintain separate accounting for grant funds</li>
              <li>Follow funder's financial policies</li>
              <li>Retain receipts and documentation</li>
              <li>Submit financial reports as required</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Programmatic Compliance</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Deliver services as proposed</li>
              <li>Meet performance targets and outcomes</li>
              <li>Collect and report required data</li>
              <li>Acknowledge funder in materials and communications</li>
              <li>Comply with special conditions</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Required Reports</h3>
            <p className="text-black mb-4">
              Typical reporting requirements:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Progress Reports:</strong> Quarterly or semi-annual updates on activities</li>
              <li><strong>Financial Reports:</strong> Expenditure reports with supporting documentation</li>
              <li><strong>Final Report:</strong> Comprehensive summary of outcomes and impact</li>
              <li><strong>Evaluation Reports:</strong> Assessment of project effectiveness</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Grant Closeout</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Closeout Process</h3>
            <p className="text-black mb-4">
              At grant end:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Complete all project activities</li>
              <li>Submit final reports and documentation</li>
              <li>Return any unused funds if required</li>
              <li>Archive all grant records</li>
              <li>Conduct internal evaluation</li>
              <li>Document lessons learned</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Grants Office</h2>
            <p className="text-black mb-4">
              For grant opportunities or assistance:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> elevate4humanityedu@gmail.com</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/federal-compliance" className="text-brand-blue-600 hover:underline">Federal Compliance Policy</a></li>
                <li><a href="/policies/funding-verification" className="text-brand-blue-600 hover:underline">Funding Verification Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
