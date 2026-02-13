import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SAM.gov Eligibility Criteria | Elevate for Humanity',
  description: 'SAM.gov registration and eligibility requirements for federal grant and contract opportunities at Elevate for Humanity.',
  keywords: ['SAM.gov', 'federal grants', 'government contracts', 'eligibility criteria', 'federal funding', 'grant opportunities', 'DUNS', 'UEI'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/sam-gov-eligibility',
  },
};

export default function SAMGovEligibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Sam Gov Eligibility' }]} />
        <article className="prose prose-lg max-w-none mt-6">
      <h1>SAM.gov Eligibility Criteria</h1>
      <p className="text-xl text-gray-600 mb-8">Last Updated: December 22, 2024</p>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <p className="text-lg font-semibold text-blue-900 mb-2">Federal Funding Opportunities</p>
        <p className="text-blue-800">
          Elevate for Humanity maintains active registration in the System for Award Management (SAM.gov) 
          to pursue federal grant and contract opportunities that support our mission to provide accessible 
          workforce education.
        </p>
      </div>

      <section className="mb-12">
        <h2>Purpose</h2>
        <p>
          This policy outlines the eligibility criteria and requirements for Elevate for Humanity's 
          participation in federal funding opportunities through SAM.gov, including:
        </p>
        <ul>
          <li>Federal grants for workforce development</li>
          <li>Department of Labor funding programs</li>
          <li>Department of Education grants</li>
          <li>Federal contracts for training services</li>
          <li>Cooperative agreements and partnerships</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>What is SAM.gov?</h2>
        <p>
          The System for Award Management (SAM.gov) is the official U.S. government system that:
        </p>
        <ul>
          <li>Consolidates federal procurement systems</li>
          <li>Registers entities doing business with the federal government</li>
          <li>Validates entity information and credentials</li>
          <li>Tracks exclusions and debarments</li>
          <li>Posts federal contract and grant opportunities</li>
          <li>Manages entity compliance and reporting</li>
        </ul>
        <p>
          Registration in SAM.gov is required for any organization seeking to receive federal grants, 
          contracts, or cooperative agreements.
        </p>
      </section>

      <section className="mb-12">
        <h2>Organizational Eligibility Requirements</h2>
        
        <h3>Legal Entity Status</h3>
        <p>
          Elevate for Humanity must maintain:
        </p>
        <ul>
          <li><strong>Legal Formation:</strong> Valid incorporation or organization under state law</li>
          <li><strong>Tax Status:</strong> Current IRS determination letter (501(c)(3) or other applicable status)</li>
          <li><strong>Good Standing:</strong> Active status with state of incorporation</li>
          <li><strong>Registered Agent:</strong> Current registered agent for legal service</li>
        </ul>

        <h3>Unique Entity Identifier (UEI)</h3>
        <p>
          We maintain a valid Unique Entity Identifier (UEI) assigned through SAM.gov, which:
        </p>
        <ul>
          <li>Replaced the DUNS number system in April 2022</li>
          <li>Uniquely identifies our organization in federal systems</li>
          <li>Is required for all federal funding applications</li>
          <li>Must be kept current and accurate</li>
        </ul>

        <h3>SAM.gov Registration</h3>
        <p>
          Our SAM.gov registration includes:
        </p>
        <ul>
          <li><strong>Entity Information:</strong> Legal name, address, and contact details</li>
          <li><strong>CAGE Code:</strong> Commercial and Government Entity code</li>
          <li><strong>NAICS Codes:</strong> North American Industry Classification System codes for our services</li>
          <li><strong>Banking Information:</strong> Electronic Funds Transfer (EFT) details for payments</li>
          <li><strong>Points of Contact:</strong> Designated officials for various functions</li>
          <li><strong>Representations and Certifications:</strong> Required compliance statements</li>
        </ul>

        <h3>Registration Maintenance</h3>
        <ul>
          <li>Registration must be renewed annually</li>
          <li>Updates required within 30 days of any changes</li>
          <li>Continuous monitoring for accuracy</li>
          <li>Designated staff responsible for maintenance</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Compliance Requirements</h2>
        
        <h3>Federal Regulations</h3>
        <p>
          We maintain compliance with:
        </p>
        <ul>
          <li><strong>2 CFR 200:</strong> Uniform Administrative Requirements, Cost Principles, and Audit Requirements (Uniform Guidance)</li>
          <li><strong>Federal Acquisition Regulation (FAR):</strong> For contract opportunities</li>
          <li><strong>Agency-Specific Regulations:</strong> DOL, DOE, and other relevant agencies</li>
          <li><strong>OMB Circulars:</strong> Office of Management and Budget guidance</li>
        </ul>

        <h3>Financial Management</h3>
        <ul>
          <li><strong>Accounting System:</strong> Adequate financial management system</li>
          <li><strong>Internal Controls:</strong> Policies and procedures for fund management</li>
          <li><strong>Audit Capability:</strong> Ability to undergo federal audits</li>
          <li><strong>Cost Allocation:</strong> Proper allocation of direct and indirect costs</li>
          <li><strong>Financial Reporting:</strong> Timely and accurate financial reports</li>
        </ul>

        <h3>Organizational Capacity</h3>
        <ul>
          <li><strong>Technical Capability:</strong> Expertise to deliver proposed services</li>
          <li><strong>Management Capacity:</strong> Ability to manage federal awards</li>
          <li><strong>Past Performance:</strong> Track record of successful program delivery</li>
          <li><strong>Facilities and Equipment:</strong> Adequate resources for program implementation</li>
        </ul>

        <h3>Legal Compliance</h3>
        <ul>
          <li><strong>No Debarment:</strong> Not excluded or debarred from federal programs</li>
          <li><strong>No Suspension:</strong> Not suspended from federal contracting</li>
          <li><strong>Tax Compliance:</strong> Current on all federal tax obligations</li>
          <li><strong>Debt Status:</strong> No delinquent federal debts</li>
          <li><strong>Lobbying Restrictions:</strong> Compliance with lobbying disclosure requirements</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Opportunity-Specific Eligibility</h2>
        
        <h3>Grant Eligibility Factors</h3>
        <p>
          For each federal grant opportunity, we assess:
        </p>
        <ul>
          <li><strong>Entity Type:</strong> Whether we qualify as an eligible applicant (nonprofit, educational institution, etc.)</li>
          <li><strong>Geographic Scope:</strong> Service area requirements and restrictions</li>
          <li><strong>Program Focus:</strong> Alignment with our mission and capabilities</li>
          <li><strong>Target Population:</strong> Ability to serve specified beneficiaries</li>
          <li><strong>Matching Requirements:</strong> Capacity to provide required cost share or match</li>
          <li><strong>Performance Standards:</strong> Ability to meet outcome and performance metrics</li>
        </ul>

        <h3>Contract Eligibility Factors</h3>
        <ul>
          <li><strong>Small Business Status:</strong> Size standards for set-aside opportunities</li>
          <li><strong>Socioeconomic Categories:</strong> Woman-owned, veteran-owned, HUBZone, etc.</li>
          <li><strong>Technical Requirements:</strong> Specific qualifications or certifications</li>
          <li><strong>Security Clearances:</strong> If required for contract performance</li>
          <li><strong>Bonding Capacity:</strong> For construction or high-value contracts</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Representations and Certifications</h2>
        
        <h3>Required Certifications</h3>
        <p>
          We maintain current certifications regarding:
        </p>
        <ul>
          <li><strong>Drug-Free Workplace:</strong> Compliance with Drug-Free Workplace Act</li>
          <li><strong>Lobbying Activities:</strong> Disclosure of lobbying activities and expenditures</li>
          <li><strong>Debarment and Suspension:</strong> Certification of non-debarment</li>
          <li><strong>Civil Rights:</strong> Compliance with civil rights laws and nondiscrimination</li>
          <li><strong>Environmental Standards:</strong> Compliance with environmental regulations</li>
          <li><strong>Labor Standards:</strong> Compliance with Davis-Bacon and other labor laws</li>
          <li><strong>Trafficking in Persons:</strong> Prohibition on trafficking and forced labor</li>
        </ul>

        <h3>Annual Updates</h3>
        <p>
          All representations and certifications are reviewed and updated annually, or more frequently 
          if circumstances change.
        </p>
      </section>

      <section className="mb-12">
        <h2>Opportunity Identification and Pursuit</h2>
        
        <h3>Monitoring Process</h3>
        <ul>
          <li><strong>Daily Monitoring:</strong> Regular review of SAM.gov opportunity postings</li>
          <li><strong>Keyword Alerts:</strong> Automated alerts for relevant opportunities</li>
          <li><strong>Agency Forecasts:</strong> Tracking of agency funding forecasts</li>
          <li><strong>Partner Notifications:</strong> Coordination with partner organizations</li>
        </ul>

        <h3>Eligibility Assessment</h3>
        <p>
          For each opportunity, we conduct a preliminary assessment of:
        </p>
        <ol>
          <li>Basic eligibility requirements</li>
          <li>Alignment with organizational mission and capacity</li>
          <li>Financial and resource requirements</li>
          <li>Likelihood of success</li>
          <li>Strategic value and impact</li>
        </ol>

        <h3>Go/No-Go Decision</h3>
        <p>
          Leadership reviews eligibility assessment and makes a go/no-go decision based on:
        </p>
        <ul>
          <li>Mission alignment</li>
          <li>Organizational capacity</li>
          <li>Resource availability</li>
          <li>Competitive positioning</li>
          <li>Strategic priorities</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Application Requirements</h2>
        
        <h3>Standard Application Components</h3>
        <ul>
          <li><strong>SF-424:</strong> Application for Federal Assistance</li>
          <li><strong>SF-424A/B:</strong> Budget Information</li>
          <li><strong>Project Narrative:</strong> Detailed program description</li>
          <li><strong>Budget Narrative:</strong> Justification for costs</li>
          <li><strong>Organizational Information:</strong> Capacity and experience</li>
          <li><strong>Certifications:</strong> Required representations and assurances</li>
        </ul>

        <h3>Supporting Documentation</h3>
        <ul>
          <li>IRS determination letter</li>
          <li>Audited financial statements</li>
          <li>Articles of incorporation and bylaws</li>
          <li>Board roster and resolutions</li>
          <li>Letters of support and commitment</li>
          <li>Resumes of key personnel</li>
        </ul>

        <h3>Submission Process</h3>
        <ul>
          <li>Applications submitted through Grants.gov or agency portals</li>
          <li>Compliance with formatting and page limits</li>
          <li>Timely submission before deadlines</li>
          <li>Confirmation of receipt and tracking</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Post-Award Compliance</h2>
        
        <h3>Award Acceptance</h3>
        <p>
          Upon award notification, we:
        </p>
        <ul>
          <li>Review award terms and conditions</li>
          <li>Negotiate modifications if necessary</li>
          <li>Accept award formally</li>
          <li>Establish project management structure</li>
          <li>Set up accounting and tracking systems</li>
        </ul>

        <h3>Ongoing Compliance</h3>
        <ul>
          <li><strong>Financial Management:</strong> Proper use and accounting of federal funds</li>
          <li><strong>Reporting:</strong> Timely submission of progress and financial reports</li>
          <li><strong>Record Keeping:</strong> Maintenance of required documentation</li>
          <li><strong>Monitoring:</strong> Internal monitoring and evaluation</li>
          <li><strong>Audits:</strong> Cooperation with federal audits and reviews</li>
        </ul>

        <h3>Closeout</h3>
        <ul>
          <li>Final reports and deliverables</li>
          <li>Financial reconciliation</li>
          <li>Return of unused funds</li>
          <li>Record retention (typically 3-5 years)</li>
          <li>Final audit if required</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Disqualifying Factors</h2>
        
        <h3>Automatic Disqualification</h3>
        <p>
          We would be ineligible for federal funding if:
        </p>
        <ul>
          <li>Debarred or suspended from federal programs</li>
          <li>Excluded from federal contracting</li>
          <li>Delinquent on federal debt</li>
          <li>Non-compliant with federal tax obligations</li>
          <li>Convicted of fraud or other serious crimes</li>
          <li>In default on previous federal awards</li>
        </ul>

        <h3>Risk Factors</h3>
        <p>
          Factors that may affect eligibility or require mitigation:
        </p>
        <ul>
          <li>History of non-compliance with federal awards</li>
          <li>Qualified or adverse audit opinions</li>
          <li>Financial instability or going concern issues</li>
          <li>Lack of adequate financial management systems</li>
          <li>Unresolved audit findings</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Roles and Responsibilities</h2>
        
        <h3>Grants Management Team</h3>
        <ul>
          <li><strong>Grants Director:</strong> Overall responsibility for federal funding strategy</li>
          <li><strong>SAM.gov Administrator:</strong> Maintains registration and updates</li>
          <li><strong>Grants Writer:</strong> Prepares applications and proposals</li>
          <li><strong>Financial Manager:</strong> Ensures financial compliance</li>
          <li><strong>Program Manager:</strong> Implements awarded programs</li>
        </ul>

        <h3>Executive Leadership</h3>
        <ul>
          <li>Approves pursuit of opportunities</li>
          <li>Signs applications and certifications</li>
          <li>Accepts awards on behalf of organization</li>
          <li>Ensures organizational compliance</li>
        </ul>

        <h3>Board of Directors</h3>
        <ul>
          <li>Provides governance oversight</li>
          <li>Approves major grant applications</li>
          <li>Ensures fiduciary responsibility</li>
          <li>Reviews compliance and performance</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Contact Information</h2>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="mt-0">Grants Office</h3>
          <p className="mb-2">
            <strong>Email:</strong>{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:text-blue-800">
              elevate4humanityedu@gmail.com
            </a>
          </p>
          <p className="mb-2">
            <strong>Phone:</strong>{' '}
            <a href="/support" className="text-blue-600 hover:text-blue-800">
              Get Help Online
            </a>
          </p>
        </div>

        <h3>SAM.gov Resources</h3>
        <ul>
          <li>
            <strong>SAM.gov Website:</strong>{' '}
            <a href="https://sam.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              sam.gov
            </a>
          </li>
          <li>
            <strong>SAM.gov Help:</strong>{' '}
            <a href="https://fsd.gov/gsafsd_sp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              Federal Service Desk
            </a>
          </li>
          <li>
            <strong>Grants.gov:</strong>{' '}
            <a href="https://grants.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
              grants.gov
            </a>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2>Related Policies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/policies/grant-application" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Grant Application Policy</h3>
            <p className="text-blue-800 text-sm mb-0">Grant application and management procedures</p>
          </Link>
          <Link href="/policies/federal-compliance" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Federal Compliance Policy</h3>
            <p className="text-blue-800 text-sm mb-0">Federal regulations and compliance requirements</p>
          </Link>
          <Link href="/policies/wioa" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">WIOA Compliance</h3>
            <p className="text-blue-800 text-sm mb-0">Workforce Innovation and Opportunity Act compliance</p>
          </Link>
          <Link href="/policies/funding-verification" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Funding Verification</h3>
            <p className="text-blue-800 text-sm mb-0">Verification of funding eligibility and status</p>
          </Link>
        </div>
      </section>

      <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-8">
        <p className="text-lg font-semibold text-green-900 mb-2">Questions About Federal Funding?</p>
        <p className="text-green-800 mb-0">
          Contact our Grants Office at{' '}
          <a href="mailto:elevate4humanityedu@gmail.com" className="text-green-900 font-semibold hover:underline">
            elevate4humanityedu@gmail.com
          </a>{' '}
          or call{' '}
          <a href="/support" className="text-green-900 font-semibold hover:underline">
            Get Help Online
          </a>.
        </p>
      </div>
        </article>
      </div>
    </div>
  );
}
