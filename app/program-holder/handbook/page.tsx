import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AcknowledgeHandbookForm } from './AcknowledgeHandbookForm';
import { AlertTriangle, BookOpen, Info, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Program Holder Handbook | Elevate For Humanity',
  description: 'Program Holder Handbook — Required Reading Before You Begin',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/handbook',
  },
};

export default async function ProgramHolderHandbookPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: acknowledgement } = await db
    .from('program_holder_acknowledgements')
    .select('*')
    .eq('user_id', user.id)
    .eq('document_type', 'handbook')
    .single();

  if (acknowledgement) redirect('/program-holder/dashboard?handbook=acknowledged');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Program Holder', href: '/program-holder' }, { label: 'Handbook' }]} />
      </div>

      {/* Header */}
      <div className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <BookOpen size={48} />
            <div>
              <h1 className="text-4xl font-bold">Program Holder Handbook</h1>
              <p className="text-slate-300 mt-2">Elevate for Humanity — Required Reading Before You Begin</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4 max-w-2xl">
            This handbook explains how the Training Network operates, what is expected of you, how you get paid,
            and what your rights are — including your right to exit. Every section is non-negotiable.
            Read it fully before acknowledging.
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
              Every section of this handbook reflects federal WIOA requirements, Indiana DWD rules, or Elevate
              operating policy. None of it is optional. If any section is unclear, contact us before signing —
              not after. Acknowledging this handbook means you have read it, understood it, and agree to it as written.
            </p>
          </div>
        </div>
        <div className="prose prose-slate max-w-none mb-12">
          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2 mt-0">1. What Elevate For Humanity Is</h2>
          <p>
            Elevate for Humanity is a workforce development organization based in Indianapolis, Indiana. We provide
            career training, credentialing, and job placement support to job seekers, returning citizens, veterans,
            and underserved communities. We operate as an eligible training provider under Indiana&apos;s INTraining /
            Eligible Training Provider List (ETPL) system, administered by the Indiana Department of Workforce
            Development (DWD).
          </p>
          <p>
            <strong>What this means for you:</strong> When you deliver training under the Elevate name, you are
            operating as an authorized delivery site within our Training Network. You are not a co-owner, partner,
            or franchise operator. Elevate owns the programs, the curriculum, the credentials, and the brand.
            You provide the space, the students, or the coordination — depending on your tier.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">2. Your Role as a Program Holder</h2>
          <p>
            A Program Holder is an organization or individual authorized to host or support delivery of Elevate
            training programs at an approved site. Your specific responsibilities depend on which participation
            tier you signed under (see Section 5). In all cases, Program Holders are responsible for:
          </p>
          <ul>
            <li><strong>Student Recruitment:</strong> You are responsible for maintaining enrollment levels through outreach, marketing, and community partnerships. Elevate does not guarantee a pipeline of students to your site.</li>
            <li><strong>WorkOne Registration (REQUIRED for WIOA-funded students):</strong> All students seeking WIOA funding must be registered through WorkOne before enrollment. This is a federal compliance requirement — not optional. Failure to complete WorkOne registration can result in loss of funding for those students.</li>
            <li><strong>Attendance Tracking:</strong> Recording and submitting student attendance to Elevate within 48 hours of each session. Attendance records are required for compliance reporting and payment processing.</li>
            <li><strong>Facility Readiness (Tier 1 only):</strong> Maintaining a safe, accessible, and properly equipped training space for the full cohort duration.</li>
            <li><strong>Communication:</strong> Responding to Elevate staff inquiries within 48 hours and reporting any student issues, safety concerns, or compliance problems immediately.</li>
            <li><strong>Document Submission:</strong> Keeping all required documents current (see Section 3).</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">3. Required Documents — No Exceptions</h2>
          <div className="not-prose bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-900 font-semibold text-sm">
              You cannot enroll students or receive payments until ALL required documents are submitted and
              approved. This is not negotiable. There are no exceptions.
            </p>
          </div>
          <ul>
            <li><strong>State Business License</strong> — Current and valid license to operate in your state.</li>
            <li><strong>Training Provider License</strong> — State-issued license to operate as a training provider, if required for your industry or program type.</li>
            <li><strong>Facility Inspection Certificate</strong> — Proof that your training space meets state safety and ADA accessibility standards (Tier 1 only).</li>
            <li><strong>Instructor Credentials</strong> — Copies of all instructor licenses, certifications, and relevant qualifications for each program you will deliver.</li>
            <li><strong>General Liability Insurance</strong> — Certificate of insurance showing minimum $1,000,000 per occurrence / $2,000,000 aggregate. Elevate for Humanity must be named as an additional insured.</li>
            <li><strong>Workers&apos; Compensation Insurance</strong> — Proof of coverage for all employees who will be present at the training site.</li>
            <li><strong>Background Checks</strong> — Criminal background checks for all staff who will have direct contact with students.</li>
            <li><strong>Federal EIN / Tax ID</strong> — Your Federal Employer Identification Number.</li>
            <li><strong>W-9 Form</strong> — Required for payment processing.</li>
            <li><strong>Approved Curriculum</strong> — Confirmation that you will use Elevate&apos;s curriculum exclusively. You may not substitute, supplement, or modify it without written authorization.</li>
            <li><strong>Equipment Inventory</strong> — List of training equipment and tools available to students (Tier 1 only).</li>
          </ul>
          <p className="text-sm text-slate-500">
            Documents must be renewed annually or whenever they expire. Lapsed documents will result in
            suspension of enrollment until renewed.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">4. Student Management and FERPA</h2>
          <p>
            All students enrolled in Elevate programs are Elevate students — regardless of which physical site
            delivers their training. Student records, enrollment data, credential progress, and outcome data are
            maintained exclusively by Elevate.
          </p>
          <ul>
            <li>You may not share student personally identifiable information (PII) with any third party without written student consent and Elevate authorization.</li>
            <li>Student records are protected under FERPA (Family Educational Rights and Privacy Act). Violations carry federal penalties.</li>
            <li>You must verify student eligibility before enrollment using Elevate&apos;s intake process — not your own independent process.</li>
            <li>You must document and report any student incidents (safety, conduct, attendance) to Elevate within 24 hours.</li>
            <li>You may not disenroll, dismiss, or transfer a student without Elevate authorization.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">5. Participation Tiers and How You Get Paid</h2>
          <p>
            Your compensation is determined by the tier you signed under in your Training Network Partner Agreement.
            These amounts are fixed. They are not subject to renegotiation after signing.
          </p>
          <div className="not-prose space-y-4 my-4">
            <div className="border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 mb-1">Tier 1 — Facility Host: 1/3 of net program revenue per cohort</h3>
              <p className="text-sm text-slate-600 mb-3">You provide a dedicated physical training facility and on-site operational support for the full cohort duration.</p>
              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                <p className="font-semibold text-brand-blue-900 text-sm">Payment Example (Per Student):</p>
                <p className="text-sm text-brand-blue-800 mt-1">
                  Barber Program — $6,000 WIOA funding · Direct costs ~$550 · Net Revenue ~$5,450<br />
                  Your Share (1/3): ~$1,816.50 · Payment 1 at 50% completion: ~$908.25 · Payment 2 at credential: ~$908.25<br />
                  <strong>10 students = ~$18,165 · 50 students = ~$90,825</strong>
                </p>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 mb-1">Tier 2 — Coordination Partner: 15% of net program revenue per cohort</h3>
              <p className="text-sm text-slate-600">You provide student coordination and supervision support. You do not provide a training facility.</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 mb-1">Tier 3 — Referral Partner: $250–$500 flat fee per enrolled student</h3>
              <p className="text-sm text-slate-600">You refer eligible individuals to Elevate programs. No operational responsibility. No revenue share.</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Net revenue = gross tuition minus direct program costs (credential exam fees, LMS, curriculum, marketing,
            compliance, administration, payment processing, insurance, student services, and Program Support Fee).
            Payments are per student, not per cohort lump sum. Invoices must include supporting documentation.
            Payments are processed within 30 days of invoice approval.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">6. Compliance Requirements — Federal Law, Not Our Preference</h2>
          <p>
            These requirements exist because Elevate operates under WIOA and Indiana DWD oversight. They are
            federal and state law. They are not negotiable under any circumstances.
          </p>
          <ul>
            <li><strong>WIOA Nondiscrimination (WIOA Section 188):</strong> You may not discriminate against any student or applicant on the basis of race, color, religion, sex, national origin, age, disability, political affiliation, or citizenship. Violations are reported to the U.S. Department of Labor.</li>
            <li><strong>ADA / Section 504 Accessibility:</strong> Your facility and program must be accessible to individuals with disabilities. This is not optional.</li>
            <li><strong>Accurate Reporting:</strong> All attendance, enrollment, and outcome data submitted to Elevate must be truthful and complete. Falsifying records is grounds for immediate termination and may result in federal criminal penalties.</li>
            <li><strong>Financial Accountability:</strong> Funds received from Elevate may only be used for allowable program costs. Financial records must be maintained for a minimum of 7 years and made available for audit upon request.</li>
            <li><strong>Audit Cooperation:</strong> You must cooperate fully with any audit or monitoring visit conducted by Elevate, Indiana DWD, or any federal oversight agency. Refusal to cooperate is grounds for immediate termination.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">7. Quality Standards</h2>
          <ul>
            <li><strong>Qualified Instructors:</strong> All instructors must hold current credentials required for the program they teach. Credentials must be submitted to Elevate before instruction begins. You may not allow an uncredentialed instructor to teach.</li>
            <li><strong>Curriculum:</strong> You must use Elevate&apos;s approved curriculum as delivered. You may not modify, supplement, or replace it without written authorization from Elevate.</li>
            <li><strong>Facility Standards:</strong> Training spaces must be clean, safe, properly equipped, and accessible. Elevate may conduct unannounced site visits to verify standards.</li>
            <li><strong>Student Outcomes:</strong> Program Holders are expected to maintain credential attainment rates consistent with Elevate&apos;s network benchmarks. Persistent underperformance will result in corrective action or termination.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">8. Confidentiality and Non-Disclosure</h2>
          <p>
            By operating as a Program Holder, you receive access to Elevate&apos;s proprietary curriculum, operational
            procedures, student data, financial structures, and business relationships. All of this is confidential.
          </p>
          <ul>
            <li>You may not disclose Elevate&apos;s curriculum, pricing, operational procedures, or student data to any third party without written authorization.</li>
            <li>You may not use Elevate&apos;s confidential information to develop, support, or operate a competing program.</li>
            <li>Confidentiality obligations survive termination of this agreement for three (3) years.</li>
            <li>A full Non-Disclosure Agreement is available at <strong>/legal/nda</strong> and is incorporated by reference into your MOU.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">9. Non-Compete and Non-Replication</h2>
          <p>
            This section protects the program model you are being given access to. It is not punitive — it is
            necessary to protect the integrity of the Training Network and the students it serves.
          </p>
          <ul>
            <li>During the term of your agreement and for three (3) years following termination, you may not replicate, reproduce, or develop a substantially similar training program using materials, systems, or methods provided through this collaboration.</li>
            <li>You may not solicit or redirect enrolled students, instructors, credential partners, or employers into a competing program derived from the Elevate training model.</li>
            <li>You may not use Elevate&apos;s program structure or credential relationships to apply independently for ETPL status or workforce funding for a competing program.</li>
            <li>A full Non-Compete Agreement is available at <strong>/legal/non-compete</strong> and is incorporated by reference into your MOU.</li>
          </ul>
          <p className="text-sm text-slate-500">
            These restrictions do not prevent you from operating your existing business, employing staff, or
            participating in unrelated training programs. They only restrict replication of the Elevate model.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">10. Your Right to Exit — 30 Days Written Notice</h2>
          <div className="not-prose bg-brand-blue-50 border-l-4 border-brand-blue-600 p-5 rounded-r-xl mb-4 flex gap-3">
            <Info className="w-5 h-5 text-brand-blue-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-brand-blue-900 mb-1">You have the right to exit this agreement at any time.</p>
              <p className="text-brand-blue-800 text-sm">
                Either party — you or Elevate — may terminate this agreement for any reason by providing
                <strong> 30 days written notice</strong>. You do not need to provide a reason. You do not need
                Elevate&apos;s permission. Send written notice (email is acceptable) to your assigned Elevate
                coordinator and copy <strong>elevate4humanityedu@gmail.com</strong>. Termination takes effect
                30 days from the date of notice.
              </p>
            </div>
          </div>
          <p><strong>During the 30-day notice period:</strong> Cohorts already in progress continue under the agreement until completion. You remain responsible for students currently enrolled at your site.</p>
          <p><strong>After termination:</strong></p>
          <ul>
            <li>Complete services for any students currently enrolled at your site, or coordinate transfer with Elevate.</li>
            <li>Transfer all student records to Elevate within 10 business days.</li>
            <li>Return all Elevate materials, equipment, and proprietary documents.</li>
            <li>Submit final attendance reports and invoices within 30 days of termination.</li>
            <li>Elevate will process any outstanding payments owed to you within 30 days of receiving final documentation.</li>
            <li>Confidentiality and non-compete obligations remain in effect for 3 years after termination.</li>
          </ul>
          <p><strong>Immediate termination by Elevate (no notice required):</strong> Elevate may terminate immediately — without the 30-day notice period — if you: fail to maintain required insurance, violate federal nondiscrimination requirements, falsify student records, misrepresent Elevate programs or credentials, represent yourself as a partner or co-owner of Elevate, or modify curriculum or tuition without authorization.</p>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">11. Support Available to You</h2>
          <ul>
            <li>Technical assistance with the LMS platform and student tracking tools</li>
            <li>Compliance guidance and training on WIOA requirements</li>
            <li>Marketing materials and recruitment support</li>
            <li>Student support services coordination (case management, barrier removal)</li>
            <li>Regular check-ins and performance reviews with your assigned Elevate contact</li>
            <li>Access to Elevate&apos;s credential exam relationships and testing resources</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">12. Approval Status</h2>
          <div className="not-prose bg-brand-green-50 border-l-4 border-brand-green-600 p-5 rounded-r-xl">
            <p className="font-bold text-brand-green-900 mb-1">Acknowledging this handbook + signing the MOU = Approved Status</p>
            <p className="text-brand-green-800 text-sm">
              Once you acknowledge this handbook AND sign the Training Network Partner Agreement (MOU), your
              site is officially approved. You may immediately begin enrolling students, operating training
              programs, and receiving payments per the MOU terms.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 border-b pb-2">13. Contact</h2>
          <ul>
            <li><strong>Phone:</strong> (317) 314-3757</li>
            <li><strong>Email:</strong> elevate4humanityedu@gmail.com</li>
            <li><strong>Address:</strong> 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</li>
            <li><strong>Platform Support:</strong> Available through your Program Holder dashboard</li>
          </ul>
        </div>

        {/* Acknowledgement Form */}
        <div className="bg-white rounded-xl p-8 border-2 border-slate-200">
          <div className="flex items-start gap-4 mb-6">
            <BookOpen className="w-8 h-8 text-slate-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-black mb-2">Acknowledgement Required</h3>
              <p className="text-slate-600">
                By acknowledging below, you confirm you have read every section of this handbook,
                understand it, and agree to it as written — including the confidentiality obligations,
                non-compete restrictions, and your right to exit with 30 days written notice.
                These terms are not up for negotiation.
              </p>
            </div>
          </div>
          <AcknowledgeHandbookForm />
        </div>
      </div>
    </div>
  );
}
