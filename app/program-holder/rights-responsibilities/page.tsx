import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AcknowledgeRightsForm } from './AcknowledgeRightsForm';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Rights & Responsibilities | Elevate For Humanity',
  description: 'Program Holder Rights & Responsibilities - Required Reading',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/rights-responsibilities',
  },
};

export default async function ProgramHolderRightsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Rights Responsibilities" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if already acknowledged
  const { data: acknowledgement } = await db
    .from('program_holder_acknowledgements')
    .select('*')
    .eq('user_id', user.id)
    .eq('document_type', 'rights')
    .single();

  if (acknowledgement) {
    redirect('/program-holder/dashboard?rights=acknowledged');
  }

  return (
    <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Rights Responsibilities" }]} />
        </div>
      {/* Header */}
      <div className="bg-brand-blue-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Shield size={48} />
            <div>
              <h1 className="text-4xl font-bold">
                Program Holder Rights & Responsibilities
              </h1>
              <p className="text-brand-blue-200 mt-2">
                Required Reading - Please Review Carefully
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none mb-12">
          <h2>Your Rights as a Program Holder</h2>
          <p>
            As a valued partner in workforce development, you have the following
            rights:
          </p>

          <h3>1. Right to Fair Treatment</h3>
          <ul>
            <li>Receive timely payment for services rendered</li>
            <li>Access technical support and assistance</li>
            <li>Participate in program planning and feedback</li>
            <li>Receive clear communication about policies and procedures</li>
            <li>Appeal decisions that affect your program</li>
          </ul>

          <h3>2. Right to Resources</h3>
          <ul>
            <li>Access to platform tools and features</li>
            <li>Marketing and recruitment support</li>
            <li>Training and professional development</li>
            <li>Student support services coordination</li>
            <li>Compliance guidance and assistance</li>
          </ul>

          <h3>3. Right to Due Process</h3>
          <ul>
            <li>Written notice of any compliance issues</li>
            <li>Opportunity to respond to concerns</li>
            <li>Fair and impartial review of disputes</li>
            <li>Appeal process for adverse decisions</li>
            <li>Protection from arbitrary termination</li>
          </ul>

          <h3>4. Right to Privacy</h3>
          <ul>
            <li>Protection of proprietary information</li>
            <li>Confidentiality of business records</li>
            <li>Secure data storage and transmission</li>
            <li>Control over shared information</li>
          </ul>

          <hr className="my-8" />

          <h2>Your Responsibilities as a Program Holder</h2>
          <p>With these rights come important responsibilities:</p>

          <h3>1. Student Welfare</h3>
          <ul>
            <li>
              <strong>Safety First:</strong> Maintain safe training environments
            </li>
            <li>
              <strong>Equal Access:</strong> Provide equal opportunities to all
              eligible students
            </li>
            <li>
              <strong>Support Services:</strong> Connect students with needed
              support services
            </li>
            <li>
              <strong>Respectful Environment:</strong> Foster inclusive and
              respectful learning spaces
            </li>
            <li>
              <strong>Student Rights:</strong> Protect student privacy and
              rights
            </li>
          </ul>

          <h3>2. Quality Standards</h3>
          <ul>
            <li>
              <strong>Qualified Instructors:</strong> Employ credentialed and
              experienced instructors
            </li>
            <li>
              <strong>Current Curriculum:</strong> Maintain industry-aligned,
              up-to-date curriculum
            </li>
            <li>
              <strong>Adequate Facilities:</strong> Provide appropriate training
              facilities and equipment
            </li>
            <li>
              <strong>Student Outcomes:</strong> Focus on credential attainment
              and job placement
            </li>
            <li>
              <strong>Continuous Improvement:</strong> Regularly evaluate and
              improve programs
            </li>
          </ul>

          <h3>3. Compliance and Reporting</h3>
          <ul>
            <li>
              <strong>WIOA Compliance:</strong> Follow all federal and state
              workforce regulations
            </li>
            <li>
              <strong>Accurate Reporting:</strong> Submit truthful and timely
              reports
            </li>
            <li>
              <strong>Data Integrity:</strong> Maintain accurate student records
            </li>
            <li>
              <strong>Financial Accountability:</strong> Use funds only for
              allowable purposes
            </li>
            <li>
              <strong>Audit Cooperation:</strong> Cooperate fully with audits
              and monitoring
            </li>
          </ul>

          <h3>4. Ethical Conduct</h3>
          <ul>
            <li>
              <strong>Honesty:</strong> Provide truthful information at all
              times
            </li>
            <li>
              <strong>Integrity:</strong> Act in the best interest of students
              and the program
            </li>
            <li>
              <strong>Transparency:</strong> Disclose conflicts of interest
            </li>
            <li>
              <strong>Professionalism:</strong> Maintain professional standards
              in all interactions
            </li>
            <li>
              <strong>Accountability:</strong> Take responsibility for program
              outcomes
            </li>
          </ul>

          <h3>5. Communication</h3>
          <ul>
            <li>
              <strong>Timely Response:</strong> Respond to inquiries within 48
              hours
            </li>
            <li>
              <strong>Issue Reporting:</strong> Report problems or concerns
              immediately
            </li>
            <li>
              <strong>Regular Updates:</strong> Provide status updates as
              requested
            </li>
            <li>
              <strong>Collaboration:</strong> Work cooperatively with Elevate
              for Humanity staff
            </li>
            <li>
              <strong>Feedback:</strong> Provide constructive feedback for
              program improvement
            </li>
          </ul>

          <h3>6. Financial Responsibilities</h3>
          <ul>
            <li>
              <strong>Accurate Invoicing:</strong> Submit invoices with proper
              documentation
            </li>
            <li>
              <strong>Allowable Costs:</strong> Charge only for allowable and
              reasonable costs
            </li>
            <li>
              <strong>Record Keeping:</strong> Maintain financial records for 7
              years
            </li>
            <li>
              <strong>Audit Readiness:</strong> Be prepared for financial audits
            </li>
            <li>
              <strong>Repayment:</strong> Repay any disallowed costs or
              overpayments
            </li>
          </ul>

          <h3>7. Termination Obligations</h3>
          <p>If your agreement is terminated, you must:</p>
          <ul>
            <li>Complete services for currently enrolled students</li>
            <li>Transfer student records to Elevate for Humanity</li>
            <li>Return all materials and equipment</li>
            <li>Submit final reports and invoices</li>
            <li>Cooperate with transition planning</li>
          </ul>

          <h3>8. Acknowledgement</h3>
          <p>
            By acknowledging this document, you confirm that you understand your
            rights and responsibilities as a Program Holder. You agree to uphold
            these standards and understand that failure to meet your
            responsibilities may result in corrective action or termination of
            your agreement.
          </p>
        </div>

        {/* Acknowledgement Form */}
        <div className="bg-brand-blue-50 rounded-xl p-8 border-2 border-brand-blue-200">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div>
              <h3 className="text-2xl font-bold text-black mb-2">
                Acknowledgement Required
              </h3>
              <p className="text-black">
                Please confirm that you have read and understood your Rights &
                Responsibilities.
              </p>
            </div>
          </div>
          <AcknowledgeRightsForm />
        </div>
      </div>
    </div>
  );
}
