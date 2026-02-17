import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AcknowledgeHandbookForm } from './AcknowledgeHandbookForm';
import { AlertTriangle, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employee Handbook | Elevate For Humanity',
  description: 'Program Holder Employee Handbook - Required Reading',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/handbook',
  },
};

export default async function ProgramHolderHandbookPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Handbook" }]} />
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
  const { data: acknowledgement } = await supabase
    .from('program_holder_acknowledgements')
    .select('*')
    .eq('user_id', user.id)
    .eq('document_type', 'handbook')
    .single();

  if (acknowledgement) {
    redirect('/program-holder/dashboard?handbook=acknowledged');
  }

  return (
    <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Handbook" }]} />
        </div>
      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <BookOpen size={48} />
            <div>
              <h1 className="text-4xl font-bold">
                Program Holder Employee Handbook
              </h1>
              <p className="text-slate-300 mt-2">
                Required Reading - Please Review Carefully
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none mb-12">
          <h2>Welcome to Elevate for Humanity</h2>
          <p>
            As a Program Holder partner, you play a critical role in delivering
            workforce development training to eligible participants. This
            handbook outlines your responsibilities, expectations, and the
            support available to you.
          </p>

          <h3>1. Program Holder Responsibilities</h3>
          <ul>
            <li>
              <strong>Student Enrollment:</strong> Enroll eligible students in
              approved training programs
            </li>
            <li>
              <strong>WorkOne Registration (REQUIRED):</strong> Send all
              students to WorkOne to register and track their progress through
              the state system. This is mandatory for WIOA compliance and
              funding eligibility.
            </li>
            <li>
              <strong>Progress Tracking:</strong> Monitor and report student
              progress through the platform AND through WorkOne
            </li>
            <li>
              <strong>Student Recruitment (REQUIRED):</strong> Actively recruit
              eligible students for your training programs. Program Holders are
              responsible for maintaining enrollment levels through marketing,
              outreach, and community partnerships.
            </li>
            <li>
              <strong>Attendance Verification:</strong> Verify student
              attendance and participation
            </li>
            <li>
              <strong>Credential Issuance:</strong> Issue industry-recognized
              credentials upon completion
            </li>
            <li>
              <strong>Compliance Reporting:</strong> Submit required reports to
              funding agencies
            </li>
            <li>
              <strong>Quality Standards:</strong> Maintain high-quality training
              delivery
            </li>
          </ul>

          <h3>2. Required Documentation for Program Holders</h3>
          <p>
            <strong>BEFORE YOU CAN ENROLL STUDENTS, YOU MUST SUBMIT:</strong>
          </p>
          <ul>
            <li>
              <strong>State Business License:</strong> Current and valid
              business license from your state
            </li>
            <li>
              <strong>Training Provider License:</strong> State-issued license
              to operate as a training provider (if applicable to your industry)
            </li>
            <li>
              <strong>Facility Inspection Certificate:</strong> Proof that your
              training facility meets state safety and accessibility standards
            </li>
            <li>
              <strong>Instructor Credentials:</strong> Copies of all instructor
              licenses, certifications, and qualifications
            </li>
            <li>
              <strong>Liability Insurance:</strong> Certificate of insurance
              with minimum $1 million coverage
            </li>
            <li>
              <strong>Workers' Compensation Insurance:</strong> Proof of
              coverage for all employees
            </li>
            <li>
              <strong>Background Checks:</strong> Criminal background checks for
              all staff who will interact with students
            </li>
            <li>
              <strong>Tax ID / EIN:</strong> Federal Employer Identification
              Number
            </li>
            <li>
              <strong>W-9 Form:</strong> For payment processing
            </li>
            <li>
              <strong>Curriculum Approval:</strong> State-approved curriculum
              for each program you will deliver
            </li>
            <li>
              <strong>Equipment List:</strong> Inventory of training equipment
              and tools available to students
            </li>
          </ul>
          <p className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <strong>
              <AlertTriangle className="w-5 h-5 inline-block" /> IMPORTANT:
            </strong>{' '}
            You cannot enroll students or receive payments until ALL required
            documents are submitted and approved by Elevate for Humanity and the
            state workforce agency.
          </p>

          <h3>3. Student Management</h3>
          <p>
            You are responsible for managing all aspects of student enrollment,
            progress, and completion. This includes:
          </p>
          <ul>
            <li>Verifying student eligibility before enrollment</li>
            <li>Tracking attendance and participation</li>
            <li>Documenting student progress and achievements</li>
            <li>Reporting any issues or concerns immediately</li>
            <li>Ensuring students receive proper support services</li>
          </ul>

          <h3>4. Compliance Requirements</h3>
          <p>
            As a WIOA-funded program partner, you must comply with all federal,
            state, and local regulations:
          </p>
          <ul>
            <li>
              <strong>WIOA Compliance:</strong> Follow all Workforce Innovation
              and Opportunity Act requirements
            </li>
            <li>
              <strong>Data Privacy:</strong> Protect student personally
              identifiable information (PII)
            </li>
            <li>
              <strong>Equal Opportunity:</strong> Provide equal access to all
              eligible participants
            </li>
            <li>
              <strong>Non-Discrimination:</strong> Comply with all civil rights
              laws
            </li>
            <li>
              <strong>Reporting:</strong> Submit accurate and timely reports
            </li>
          </ul>

          <h3>5. Financial Responsibilities</h3>
          <p className="font-bold text-lg mb-4">
            <AlertTriangle className="w-5 h-5 inline-block" /> PAYMENT IS PER
            STUDENT - Each student generates separate payments
          </p>
          <p>Program Holders receive payment based on student outcomes:</p>
          <ul>
            <li>
              <strong>Payment Structure:</strong> You receive 1/3 (33.33%) of
              Net Program Revenue FOR EACH INDIVIDUAL STUDENT
            </li>
            <li>
              <strong>Two Payments Per Student:</strong> 50% at mid-enrollment
              (when student reaches 50% completion) and 50% at completion (when
              student earns credential)
            </li>
            <li>
              <strong>More Students = More Revenue:</strong> Each enrolled
              student generates their own separate payments. 10 students = 10
              sets of payments, 50 students = 50 sets of payments.
            </li>
            <li>
              Payment is contingent on student completion and credential
              attainment
            </li>
            <li>Invoices must be submitted with proper documentation</li>
            <li>All expenditures must be allowable under WIOA guidelines</li>
            <li>Financial records must be maintained for audit purposes</li>
          </ul>
          <div className="mt-4 p-4 bg-brand-blue-50 border-l-4 border-brand-blue-400">
            <p className="font-semibold">Payment Example (Per Student):</p>
            <p className="text-sm mt-2">
              Student in Barber Program with $6,000 WIOA funding:
              <br />
              • Direct costs: $550 (exam, kit, background check)
              <br />
              • Net Revenue: $5,450
              <br />
              • Your Share (1/3): $1,816.50
              <br />
              • Payment 1 (mid-enrollment): $908.25
              <br />
              • Payment 2 (completion): $908.25
              <br />
              <br />
              <strong>If you have 10 students:</strong> $18,165 total revenue
              <br />
              <strong>If you have 50 students:</strong> $90,825 total revenue
            </p>
          </div>

          <h3>6. Quality Assurance</h3>
          <p>
            Elevate for Humanity maintains high standards for all training
            programs:
          </p>
          <ul>
            <li>Instructors must be qualified and credentialed</li>
            <li>Curriculum must be industry-aligned and up-to-date</li>
            <li>Facilities must meet safety and accessibility standards</li>
            <li>Equipment must be current and properly maintained</li>
            <li>Student satisfaction must be monitored and addressed</li>
          </ul>

          <h3>7. Support Services</h3>
          <p>Elevate for Humanity provides support to Program Holders:</p>
          <ul>
            <li>Technical assistance with platform usage</li>
            <li>Compliance guidance and training</li>
            <li>Marketing and recruitment support</li>
            <li>Student support services coordination</li>
            <li>Regular check-ins and performance reviews</li>
          </ul>

          <h3>8. Termination and Suspension</h3>
          <p>Program Holder agreements may be terminated or suspended for:</p>
          <ul>
            <li>Non-compliance with WIOA regulations</li>
            <li>Failure to meet quality standards</li>
            <li>Misuse of funds</li>
            <li>Failure to submit required reports</li>
            <li>Violation of student rights</li>
            <li>Breach of MOU terms</li>
          </ul>

          <h3>9. Contact Information</h3>
          <p>For questions or support:</p>
          <ul>
            <li>
              <strong>Email:</strong> our contact form
            </li>
            <li>
              <strong>Phone:</strong> (317) 314-3757
            </li>
            <li>
              <strong>Platform Support:</strong> Available through dashboard
            </li>
          </ul>

          <h3>10. Acknowledgement and Approval</h3>
          <p>
            By acknowledging this handbook, you confirm that you have read,
            understood, and agree to comply with all policies and procedures
            outlined above. You understand that failure to comply may result in
            termination of your Program Holder agreement.
          </p>
          <div className="mt-4 p-4 bg-brand-green-50 border-l-4 border-brand-green-400">
            <p className="font-semibold text-brand-green-900">
              <span className="text-slate-400 flex-shrink-0">•</span> Approval Process:
            </p>
            <p className="text-sm mt-2 text-brand-green-800">
              Once you acknowledge this handbook AND sign the MOU (Memorandum of
              Understanding), you are OFFICIALLY APPROVED as a Program Holder.
              This means:
            </p>
            <ul className="text-sm mt-2 text-brand-green-800 list-disc list-inside">
              <li>You can immediately begin enrolling students</li>
              <li>You are authorized to operate training programs</li>
              <li>You are eligible to receive payments per the MOU terms</li>
              <li>
                Your organization is in good standing with Elevate for Humanity
              </li>
            </ul>
            <p className="text-sm mt-2 text-brand-green-800 font-semibold">
              Signing the MOU = Approved Status
            </p>
          </div>
        </div>

        {/* Acknowledgement Form */}
        <div className="bg-slate-50 rounded-xl p-8 border-2 border-slate-200">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div>
              <h3 className="text-2xl font-bold text-black mb-2">
                Acknowledgement Required
              </h3>
              <p className="text-black">
                Please confirm that you have read and understood the Employee
                Handbook.
              </p>
            </div>
          </div>
          <AcknowledgeHandbookForm />
        </div>
      </div>
    </div>
  );
}
