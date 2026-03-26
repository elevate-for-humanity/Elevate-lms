import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AcknowledgeRightsForm } from './AcknowledgeRightsForm';
import { Shield, ShieldAlert, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Rights & Responsibilities | Elevate For Humanity',
  description: 'Program Holder Rights & Responsibilities — What you are entitled to and what is required of you.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/rights-responsibilities',
  },
};

export default async function ProgramHolderRightsPage() {
  const supabase = await createClient();

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
    .eq('document_type', 'rights')
    .single();

  if (acknowledgement) {
    redirect('/program-holder/dashboard?rights=acknowledged');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Program Holder', href: '/program-holder' }, { label: 'Rights & Responsibilities' }]} />
      </div>

      {/* Header */}
      <div className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <Shield size={48} />
            <div>
              <h1 className="text-4xl font-bold">Program Holder Rights & Responsibilities</h1>
              <p className="text-brand-blue-200 mt-2">Elevate for Humanity — Required Reading</p>
            </div>
          </div>
          <p className="text-brand-blue-300 text-sm mt-4 max-w-2xl">
            This document explains what you are entitled to as a Program Holder and what is required of you.
            Both sections carry equal weight. Your rights protect you. Your responsibilities protect students.
            Neither is optional.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-xl mb-10 flex gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 text-base mb-1">These terms are not up for negotiation.</p>
            <p className="text-red-800 text-sm">
              Your rights are guaranteed. Your responsibilities are required. Neither side of this document
              can be waived, modified, or selectively applied. If you have questions about any section,
              contact Elevate before acknowledging — not after.
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none mb-12">

          {/* ── PART 1: RIGHTS ── */}
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-brand-blue-600 pb-2 mt-0">Part 1: Your Rights as a Program Holder</h2>
          <p>
            These rights exist to protect you. Elevate is obligated to honor them. If you believe any of
            these rights have been violated, you have the right to file a formal grievance (see Section R5).
          </p>

          <h3 className="text-xl font-bold text-slate-800">R1. Right to Timely Payment</h3>
          <p>
            You have the right to receive payment for services rendered according to the tier structure in
            your MOU. Payments will be processed within 30 days of receiving a complete, properly documented
            invoice. Elevate may not withhold payment without written explanation and an opportunity for you
            to cure any documentation deficiency.
          </p>
          <p className="text-sm text-slate-500">
            <strong>What this means plainly:</strong> If you did the work, submitted the attendance records,
            and invoiced correctly, you get paid. Elevate cannot simply not pay you.
          </p>

          <h3 className="text-xl font-bold text-slate-800">R2. Right to Clear Communication</h3>
          <p>
            You have the right to receive clear, written communication about any policy changes, compliance
            requirements, or decisions that affect your program. Elevate will not change material terms of
            your agreement without written notice. You have the right to ask questions and receive answers
            in writing.
          </p>

          <h3 className="text-xl font-bold text-slate-800">R3. Right to Resources and Support</h3>
          <p>You have the right to access:</p>
          <ul>
            <li>The Elevate LMS platform and all tools included in your tier</li>
            <li>Marketing materials and recruitment support</li>
            <li>Compliance guidance and WIOA training</li>
            <li>Student support services coordination</li>
            <li>Your assigned Elevate coordinator for regular check-ins</li>
            <li>Elevate&apos;s credential exam relationships and testing resources</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">R4. Right to Due Process Before Termination</h3>
          <p>
            Except for immediate termination triggers (see Section T3 below), Elevate will not terminate
            your agreement without first issuing a written corrective action notice and giving you 15 days
            to cure the issue. If the issue is not resolved, Elevate will issue a 30-day written termination
            notice before the agreement ends.
          </p>
          <p className="text-sm text-slate-500">
            <strong>What this means plainly:</strong> Elevate cannot simply cut you off without warning for
            ordinary compliance issues. You get notice, you get a chance to fix it, and you get 30 days.
          </p>

          <h3 className="text-xl font-bold text-slate-800">R5. Right to File a Grievance</h3>
          <p>
            If you believe Elevate has violated your rights under this agreement, you may file a formal
            written grievance to <strong>elevate4humanityedu@gmail.com</strong> with the subject line
            &quot;Program Holder Grievance.&quot; Elevate will respond in writing within 10 business days.
            Filing a grievance does not affect your standing as a Program Holder and will not result in
            retaliation.
          </p>

          <h3 className="text-xl font-bold text-slate-800">R6. Right to Exit with 30 Days Notice</h3>
          <div className="not-prose bg-brand-blue-50 border-l-4 border-brand-blue-600 p-5 rounded-r-xl my-4 flex gap-3">
            <Info className="w-5 h-5 text-brand-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-brand-blue-900 mb-1">You may exit this agreement at any time for any reason.</p>
              <p className="text-brand-blue-800 text-sm">
                Send written notice (email is acceptable) to your assigned Elevate coordinator and copy
                <strong> elevate4humanityedu@gmail.com</strong>. Include your organization name and the
                intended termination date (minimum 30 days from the date of notice). You do not need to
                provide a reason. You do not need Elevate&apos;s permission.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-800">R7. Right to Confidentiality of Your Business Information</h3>
          <p>
            Elevate will not disclose your organization&apos;s proprietary business information, financial
            records, or internal operations to third parties without your written consent, except as required
            by law or federal oversight agencies.
          </p>

          {/* ── PART 2: RESPONSIBILITIES ── */}
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-red-600 pb-2">Part 2: Your Responsibilities as a Program Holder</h2>
          <p>
            These responsibilities are not suggestions. They are conditions of your authorization to operate
            as a Program Holder. Failure to meet them may result in corrective action, suspension, or
            termination of your agreement.
          </p>

          <h3 className="text-xl font-bold text-slate-800">P1. Student Safety and Welfare — Non-Negotiable</h3>
          <ul>
            <li><strong>Safe Environment:</strong> You must maintain a physically safe training environment at all times. Any safety hazard must be corrected immediately and reported to Elevate within 24 hours.</li>
            <li><strong>Equal Access:</strong> You must provide equal access to all eligible students regardless of race, color, religion, sex, national origin, age, disability, or any other protected characteristic. This is federal law under WIOA Section 188.</li>
            <li><strong>No Retaliation:</strong> You may not retaliate against any student who files a complaint, requests an accommodation, or exercises any right under WIOA or FERPA.</li>
            <li><strong>Incident Reporting:</strong> Any student safety incident, misconduct allegation, or emergency must be reported to Elevate within 24 hours.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">P2. Quality Standards — Non-Negotiable</h3>
          <ul>
            <li><strong>Credentialed Instructors Only:</strong> You may not allow any person to instruct students who does not hold the required credentials for that program. No exceptions.</li>
            <li><strong>Elevate Curriculum Only:</strong> You must use Elevate&apos;s approved curriculum as delivered. You may not modify, supplement, or replace it without written authorization from Elevate.</li>
            <li><strong>Facility Standards:</strong> Your training space must remain clean, safe, properly equipped, and ADA accessible throughout the agreement. Elevate may conduct unannounced site visits.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">P3. Compliance and Reporting — Federal Law</h3>
          <ul>
            <li><strong>Accurate Records:</strong> All attendance, enrollment, and outcome data submitted to Elevate must be truthful and complete. Falsifying records is a federal offense and grounds for immediate termination.</li>
            <li><strong>Timely Submission:</strong> Attendance records must be submitted within 48 hours of each session. Reports must be submitted by the deadlines Elevate specifies.</li>
            <li><strong>Financial Records:</strong> You must maintain financial records for a minimum of 7 years and make them available for audit upon request.</li>
            <li><strong>Audit Cooperation:</strong> You must cooperate fully with any audit or monitoring visit. Refusal to cooperate is grounds for immediate termination.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">P4. Confidentiality — Survives Termination</h3>
          <ul>
            <li>You may not disclose Elevate&apos;s curriculum, pricing, operational procedures, or student data to any third party without written authorization.</li>
            <li>You may not use Elevate&apos;s confidential information to develop, support, or operate a competing program.</li>
            <li>These obligations survive termination of this agreement for three (3) years.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">P5. Non-Compete and Non-Replication — 3 Years Post-Termination</h3>
          <ul>
            <li>During the term of your agreement and for three (3) years following termination, you may not replicate, reproduce, or develop a substantially similar training program using materials, systems, or methods provided through this collaboration.</li>
            <li>You may not solicit or redirect enrolled students, instructors, credential partners, or employers into a competing program derived from the Elevate training model.</li>
            <li>You may not use Elevate&apos;s program structure or credential relationships to apply independently for ETPL status or workforce funding for a competing program.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">P6. Communication</h3>
          <ul>
            <li>Respond to Elevate staff inquiries within 48 hours.</li>
            <li>Report any student issues, safety concerns, or compliance problems immediately — do not wait for a scheduled check-in.</li>
            <li>Provide status updates as requested by your assigned Elevate coordinator.</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">P7. Financial Responsibilities</h3>
          <ul>
            <li>Submit invoices with complete supporting documentation (attendance records, completion verification).</li>
            <li>Charge only for allowable and reasonable costs as defined by WIOA guidelines.</li>
            <li>Repay any disallowed costs or overpayments within 30 days of written notice from Elevate.</li>
          </ul>

          {/* ── TERMINATION ── */}
          <h2 className="text-2xl font-bold text-slate-900 border-b-2 border-slate-400 pb-2">Part 3: Termination</h2>

          <h3 className="text-xl font-bold text-slate-800">T1. Termination by You — 30 Days Notice</h3>
          <p>
            You may terminate this agreement at any time for any reason by providing 30 days written notice.
            Email your assigned Elevate coordinator and copy <strong>elevate4humanityedu@gmail.com</strong>.
            No reason required. No permission needed.
          </p>

          <h3 className="text-xl font-bold text-slate-800">T2. Termination by Elevate — 30 Days Notice</h3>
          <p>Elevate may terminate your agreement with 30 days written notice for:</p>
          <ul>
            <li>Persistent failure to meet quality standards or credential attainment benchmarks</li>
            <li>Failure to submit required reports or documentation within specified timeframes</li>
            <li>Failure to maintain required insurance or licensure</li>
            <li>Misuse of funds or submission of inaccurate invoices</li>
            <li>Violation of student rights or FERPA</li>
            <li>Breach of any material term of the MOU</li>
          </ul>
          <p className="text-sm text-slate-500">
            For non-immediate causes, Elevate will first issue a written corrective action notice and allow
            15 days to cure before issuing the 30-day termination notice.
          </p>

          <h3 className="text-xl font-bold text-slate-800">T3. Immediate Termination by Elevate — No Notice Required</h3>
          <p>Elevate may terminate immediately, without the 30-day notice period, if you:</p>
          <ul>
            <li>Fail to maintain required insurance</li>
            <li>Violate federal nondiscrimination requirements</li>
            <li>Falsify student records or attendance data</li>
            <li>Misrepresent Elevate programs or credentials</li>
            <li>Represent yourself as a partner, co-owner, or co-founder of Elevate</li>
            <li>Modify curriculum or tuition without written authorization</li>
            <li>Create an immediate safety risk to students</li>
          </ul>

          <h3 className="text-xl font-bold text-slate-800">T4. Obligations After Termination</h3>
          <ul>
            <li>Complete services for any students currently enrolled at your site, or coordinate transfer with Elevate.</li>
            <li>Transfer all student records to Elevate within 10 business days.</li>
            <li>Return all Elevate materials, equipment, and proprietary documents.</li>
            <li>Submit final attendance reports and invoices within 30 days of termination.</li>
            <li>Elevate will process any outstanding payments owed to you within 30 days of receiving final documentation.</li>
            <li>Confidentiality and non-compete obligations remain in effect for 3 years after termination.</li>
          </ul>

        </div>

        {/* Acknowledgement Form */}
        <div className="bg-brand-blue-50 rounded-xl p-8 border-2 border-brand-blue-200">
          <div className="flex items-start gap-4 mb-6">
            <Shield className="w-8 h-8 text-brand-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-black mb-2">Acknowledgement Required</h3>
              <p className="text-slate-700">
                By acknowledging below, you confirm you have read every section of this document,
                understand both your rights and your responsibilities, and agree to uphold them as written.
                These terms are not up for negotiation.
              </p>
            </div>
          </div>
          <AcknowledgeRightsForm />
        </div>
      </div>
    </div>
  );
}
