import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle } from 'lucide-react';
import MOUSignClient from './MOUSignClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Your MOU',
  description: 'Review and sign your Program Holder Memorandum of Understanding.',
};

export default async function ProgramHolderMOUPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/mou');

  const db = await requireAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.program_holder_id) redirect('/program-holder/onboarding');

  const { data: holder } = await db
    .from('program_holders')
    .select('organization_name, contact_name, mou_signed, mou_signed_at, mou_status, mou_type')
    .eq('id', profile.program_holder_id)
    .maybeSingle();

  if (!holder) redirect('/program-holder/onboarding');

  // Check for a digital signature row — paper-signed holders have mou_signed=true
  // but no mou_signatures row. They must sign digitally.
  const { data: sigRow } = await db
    .from('mou_signatures')
    .select('id, signed_at')
    .eq('user_id', user.id)
    .maybeSingle();

  const hasDigitalSignature = !!sigRow;

  const orgName = holder.organization_name || profile.full_name || 'Your Organization';
  const isCustomHvac = holder.mou_type === 'custom_hvac_codelivery';
  const isCustomCdl = holder.mou_type === 'custom_cdl_provider';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-slate-500">
            <li>
              <Link href="/program-holder/onboarding" className="hover:text-slate-700">
                Onboarding
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Memorandum of Understanding</li>
          </ol>
        </nav>

        {holder.mou_signed && hasDigitalSignature ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-brand-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-brand-green-800 mb-1">MOU Signed</h2>
            <p className="text-brand-green-700 text-sm mb-2">
              Digitally signed on{' '}
              {sigRow?.signed_at ? new Date(sigRow.signed_at).toLocaleDateString() : 'file'}
            </p>
            <Link
              href="/program-holder/onboarding"
              className="inline-block mt-4 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              Continue Onboarding
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Signature required before accessing your dashboard
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Review the agreement below and sign to activate your program holder account.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-8 mb-2 text-slate-700 text-sm leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Memorandum of Understanding</h2>
              <p className="text-xs text-slate-400 mb-6">
                {PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute · 8888 Keystone Crossing,
                Suite 1300, Indianapolis, IN 46240
              </p>

              <p className="mb-4">
                This Memorandum of Understanding (&ldquo;MOU&rdquo;) is entered into between{' '}
                <strong>{PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute</strong>{' '}
                (&ldquo;Elevate&rdquo;) and <strong>{orgName}</strong> (&ldquo;Program
                Holder&rdquo;).
              </p>

              {isCustomHvac ? (
                /* David Nazaire First Class Training Center — HVAC Co-Delivery */
                <>
                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">1. Purpose</h3>
                  <p className="mb-4">
                    The purpose of this MOU is to establish a co-delivery partnership for the HVAC
                    Technician training program. Elevate and {orgName} each hold distinct and
                    complementary responsibilities in delivering a complete, industry-recognized
                    training experience to enrolled students.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    2. Elevate Responsibilities — Related Technical Instruction (RTI)
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>
                      Deliver all Related Technical Instruction (RTI) including online coursework,
                      theory, code knowledge, and exam preparation through Elevate&apos;s LMS
                      platform
                    </li>
                    <li>Administer and proctor all written assessments and certification exams</li>
                    <li>Issue industry-recognized credentials and certificates of completion</li>
                    <li>
                      Maintain all student enrollment records, progress tracking, and compliance
                      reporting
                    </li>
                    <li>
                      Provide technical support and student success services throughout the program
                    </li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    3. Program Holder Responsibilities — Hands-On Training (OJT)
                  </h3>
                  <p className="mb-3">
                    {orgName} serves as the designated hands-on trainer for the HVAC Technician
                    program. In this capacity, {orgName} is solely responsible for all practical,
                    shop-floor, and on-the-job training components and agrees to the following:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>
                      Deliver all hands-on, practical, and on-the-job training (OJT) components of
                      the HVAC program at a designated training facility
                    </li>
                    <li>
                      Provide qualified HVAC instructors who hold applicable trade licenses or
                      certifications required by Indiana state law
                    </li>
                    <li>
                      Supply all tools, equipment, refrigerants, and materials necessary for
                      practical training sessions
                    </li>
                    <li>
                      Maintain a safe, OSHA-compliant training environment for all students at all
                      times
                    </li>
                    <li>
                      Supervise students directly during all hands-on sessions and evaluate their
                      practical competency
                    </li>
                    <li>
                      Track and report student attendance, lab hours, and practical milestone
                      completions to Elevate on a weekly basis
                    </li>
                    <li>
                      Ensure all hands-on training content aligns with EPA 608, OSHA 10, and
                      applicable Indiana licensing standards
                    </li>
                    <li>
                      Notify Elevate within 24 hours of any student safety incident, withdrawal, or
                      failure to meet attendance requirements
                    </li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    4. Program Fee, Voucher Funding, and Revenue Distribution
                  </h3>
                  <p className="mb-3">
                    The total program fee for each enrolled student shall be{' '}
                    <strong>$5,000.00</strong>.
                  </p>
                  <p className="mb-3">
                    This program is funded through third-party voucher sources, including but not
                    limited to WorkOne or other state and workforce funding agencies. Payment for
                    enrolled students is not considered received until the voucher has been issued
                    and processed by the funding agency.
                  </p>
                  <p className="mb-2 font-medium text-slate-800">
                    Payment is triggered upon confirmation of both of the following:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1 mb-4">
                    <li>
                      The student has officially started the program (defined as attendance and
                      participation beyond initial enrollment); <strong>and</strong>
                    </li>
                    <li>
                      A valid funding voucher has been issued by WorkOne or the applicable agency.
                    </li>
                  </ol>
                  <p className="mb-4">
                    Upon confirmation of both conditions, Elevate shall invoice or process the
                    voucher for payment.
                  </p>
                  <p className="mb-2 font-medium text-slate-800">Revenue Distribution</p>
                  <p className="mb-3">
                    Upon receipt of voucher funds, the program fee shall be distributed as follows:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-700">Total Program Tuition Value</span>
                      <span className="font-medium text-slate-900">$5,000.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-700">Total Operational Deductions</span>
                      <span className="text-slate-700">− $1,265.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="font-semibold text-slate-800">Net Revenue</span>
                      <span className="font-bold text-slate-900">$3,735.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-700">50% to {PLATFORM_DEFAULTS.orgName}</span>
                      <span className="font-medium text-slate-900">$1,867.50</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="text-slate-700">50% to {orgName}</span>
                      <span className="font-bold text-emerald-700">$1,867.50</span>
                    </div>
                  </div>

                  <p className="mb-2 font-medium text-slate-800">Payment Schedule</p>
                  <p className="mb-3">
                    Payments to the Program Holder are structured as follows based on student
                    sequence:
                  </p>

                  {/* First 2 students — full upfront */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
                    <p className="text-sm font-bold text-emerald-800 mb-1">
                      First 2 Students — Full Payment to Program Holder Upfront
                    </p>
                    <p className="text-sm text-emerald-700 mb-2">
                      For the first two (2) students enrolled under this agreement, Elevate shall
                      release {orgName}&apos;s full 50% share ($1,867.50 per student) in a single
                      payment. Students do not receive this payment — it is paid directly to {orgName}.
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">Full payment to FCTC</span>
                      <span className="font-bold text-emerald-800">$1,867.50 per student</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">
                      Sent within 3–10 business days following confirmed voucher approval, funding release, and receipt of all required documentation
                    </p>
                  </div>

                  {/* Student 3+ — 2 increments */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-bold text-blue-800 mb-1">
                      Students 3 and Beyond — Two-Increment Payment to Program Holder
                    </p>
                    <p className="text-sm text-blue-700 mb-3">
                      For all students enrolled after the first two, Elevate shall pay {orgName}&apos;s
                      50% share ($1,867.50 per student) in two equal increments. Students do not
                      receive these payments — all funds are paid directly to {orgName}:
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start text-sm border-b border-blue-200 pb-2">
                        <div>
                          <span className="font-semibold text-blue-800">Increment 1 — 50% on Approval</span>
                          <p className="text-xs text-blue-600 mt-0.5">
                            Upon voucher approval and confirmed program start
                          </p>
                          <p className="text-xs text-blue-600">
                            Sent within 3–10 business days of approval
                          </p>
                        </div>
                        <span className="font-bold text-blue-800 flex-shrink-0 ml-4">$933.75</span>
                      </div>
                      <div className="flex justify-between items-start text-sm pt-1">
                        <div>
                          <span className="font-semibold text-blue-800">Increment 2 — 50% on Completion</span>
                          <p className="text-xs text-blue-600 mt-0.5">
                            Upon student program completion and all milestones verified
                          </p>
                          <p className="text-xs text-blue-600">
                            Sent within 3–10 business days of completion approval
                          </p>
                        </div>
                        <span className="font-bold text-blue-800 flex-shrink-0 ml-4">$933.75</span>
                      </div>
                    </div>
                  </div>

                  <p className="mb-2 font-medium text-slate-800">Delays and Contingencies</p>
                  <p className="mb-4">
                    Elevate shall not be held liable for delays in payment caused by WorkOne or
                    other funding agencies. All payments to the Program Holder are strictly
                    contingent upon receipt of funds from the applicable funding source. Elevate
                    reserves the right to withhold or reclaim payments in the event of student
                    withdrawal, funding reversal, or documented non-compliance by the Program Holder.
                  </p>

                  <p className="mb-2 font-medium text-slate-800">Non-Standard Costs</p>
                  <p className="mb-4">
                    Retesting fees, replacement certifications, no-show fees, or additional charges
                    resulting from student failure or rescheduling are not included in the standard
                    program fee and are not subject to the 50/50 revenue split unless otherwise
                    agreed in writing.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    5. Non-Disclosure Agreement
                  </h3>
                  <p className="mb-3">
                    Each party acknowledges that in the course of this partnership they may receive
                    or have access to confidential and proprietary information belonging to the
                    other party, including but not limited to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>
                      Student records, enrollment data, and personally identifiable information
                      (PII)
                    </li>
                    <li>
                      Curriculum content, course materials, assessments, and LMS platform
                      architecture
                    </li>
                    <li>
                      Business strategies, pricing structures, funding relationships, and financial
                      terms
                    </li>
                    <li>Vendor contracts, partner agreements, and operational processes</li>
                  </ul>
                  <p className="mb-3">Both parties agree to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>
                      Hold all confidential information in strict confidence and not disclose it to
                      any third party without prior written consent
                    </li>
                    <li>
                      Use confidential information solely for the purpose of fulfilling obligations
                      under this MOU
                    </li>
                    <li>
                      Limit access to confidential information to employees or contractors who have
                      a need to know and are bound by equivalent confidentiality obligations
                    </li>
                    <li>
                      Promptly notify the other party of any unauthorized disclosure or suspected
                      breach
                    </li>
                    <li>
                      Return or destroy all confidential materials upon termination of this MOU
                    </li>
                  </ul>
                  <p className="mb-4">
                    These obligations survive termination of this MOU for a period of{' '}
                    <strong>three (3) years</strong>. Confidential information does not include
                    information that is publicly available through no fault of the receiving party,
                    independently developed without reference to the disclosing party&apos;s
                    information, or required to be disclosed by law or court order.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    6. Non-Compete Agreement
                  </h3>
                  <p className="mb-3">
                    In consideration of the partnership established under this MOU and access to
                    Elevate&apos;s proprietary curriculum, student pipeline, funding relationships,
                    and program infrastructure, {orgName} agrees to the following restrictions
                    during the term of this MOU and for a period of <strong>two (2) years</strong>{' '}
                    following its termination:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>
                      <strong>No independent program delivery:</strong> {orgName} shall not
                      independently offer, market, or deliver any HVAC training program that
                      directly competes with the program described in this MOU using curriculum,
                      materials, or methods derived from Elevate&apos;s proprietary content
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s funding partners:</strong> {orgName}{' '}
                      shall not directly solicit WorkOne, DOL, or any other funding agency
                      introduced through this partnership for the purpose of independently funding a
                      competing HVAC training program
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s students:</strong> {orgName} shall
                      not directly recruit or solicit students enrolled in Elevate programs to
                      enroll in a competing program operated by {orgName} or any affiliated entity
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s staff or instructors:</strong>{' '}
                      {orgName} shall not solicit, recruit, or hire any Elevate employee,
                      contractor, or instructor during the term of this MOU and for one (1) year
                      following termination
                    </li>
                  </ul>
                  <p className="mb-4">
                    These restrictions apply within the state of Indiana. Nothing in this section
                    prevents {orgName} from continuing to operate its existing HVAC contracting or
                    service business, provided such activities do not involve the delivery of a
                    competing training program using Elevate&apos;s proprietary materials or funding
                    relationships. If any provision of this section is found unenforceable, it shall
                    be modified to the minimum extent necessary to make it enforceable, and the
                    remaining provisions shall remain in full force.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">7. Compliance</h3>
                  <p className="mb-4">
                    Both parties agree to comply with all applicable federal, state, and local laws,
                    including WIOA requirements where applicable. Neither party shall discriminate
                    against any participant on the basis of race, color, religion, sex, national
                    origin, disability, or age.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    8. Term &amp; Termination
                  </h3>
                  <p>
                    This MOU is effective upon signing by both parties and remains in effect for one
                    (1) year, renewable annually by mutual written agreement. Either party may
                    terminate with 30 days written notice. Termination does not affect obligations
                    for students already enrolled prior to the termination date.
                  </p>
                </>
              ) : isCustomCdl ? (
                /* C1 Truck Driving — CDL Training Provider MOU */
                <>
                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">I. Purpose of Agreement</h3>
                  <p className="mb-4">
                    This MOU outlines the goals, objectives, structure, costs, and expectations of
                    the C1 CDL Training Program. The intent is to clearly define the responsibilities
                    of the training provider, the student, and the student&apos;s employer, agency,
                    or sponsor in pursuit of either a Class A or Class B Commercial Driver&apos;s
                    License (CDL).
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">II. Program Goals &amp; Objectives</h3>
                  <p className="mb-2 font-medium text-slate-800">1. Primary Objective — Class A CDL</p>
                  <p className="mb-3">
                    To provide students with the knowledge, skills, and hands-on driving experience
                    required to successfully obtain a Class A CDL and begin a career as a
                    professional commercial driver.
                  </p>
                  <p className="mb-2 font-medium text-slate-800">2. Primary Objective — Class B CDL</p>
                  <p className="mb-3">
                    To equip students with the competencies necessary to obtain a Class B CDL and
                    enter the workforce as a qualified commercial vehicle operator.
                  </p>
                  <p className="mb-2 font-medium text-slate-800">3. Overall Program Goals</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Deliver high-quality classroom, range, and road instruction in compliance with federal and state CDL standards</li>
                    <li>Prepare each student for the CDL skills test</li>
                    <li>Support students through employment preparation and job placement assistance</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">III. Program Costs</h3>
                  <p className="mb-2 font-medium text-slate-800">1. Class A CDL Training Program</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="font-medium text-slate-800">Cash Price</span>
                      <span className="font-bold text-slate-900">$4,995.00</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 mb-1 font-medium">Includes:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-xs text-slate-600 mb-2">
                      <li>Classroom instruction (online or in-person)</li>
                      <li>Behind-the-wheel range training</li>
                      <li>Road training</li>
                    </ul>
                    <p className="text-xs text-slate-500 mt-2 mb-1 font-medium">Does Not Include:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-xs text-slate-600">
                      <li>State licensing and CDL issuance fees</li>
                    </ul>
                  </div>
                  <p className="mb-2 font-medium text-slate-800">2. Class B CDL Training Program</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="font-medium text-slate-800">Cash Price</span>
                      <span className="font-bold text-slate-900">$3,495.00</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 mb-1 font-medium">Includes:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-xs text-slate-600 mb-2">
                      <li>Classroom instruction (online or in-person)</li>
                      <li>Behind-the-wheel range training</li>
                      <li>Road training</li>
                    </ul>
                    <p className="text-xs text-slate-500 mt-2 mb-1 font-medium">Does Not Include:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-xs text-slate-600">
                      <li>State licensing and CDL issuance fees</li>
                    </ul>
                  </div>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">IV. Program Format &amp; Structure</h3>
                  <p className="mb-2 font-medium text-slate-800">1. Classroom Training — Class A &amp; Class B</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li><strong>Duration:</strong> One week</li>
                    <li><strong>Delivery:</strong> Online or in-person</li>
                    <li>Curriculum covers required FMCSA ELDT theory material, safety, regulations, and foundational knowledge</li>
                  </ul>
                  <p className="mb-2 font-medium text-slate-800">2. Behind-the-Wheel, Range &amp; Road Training</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li><strong>Class A CDL:</strong> Three weeks of range and road instruction, followed by a CDL skills test</li>
                    <li><strong>Class B CDL:</strong> One week of range and road instruction, followed by a CDL skills test</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">V. Attendance &amp; Conduct Expectations</h3>
                  <p className="mb-2 font-medium text-slate-800">1. Attendance Requirement</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Students may have no more than <strong>two absences</strong> during the program</li>
                    <li>Exceeding the maximum absence limit may result in dismissal</li>
                  </ul>
                  <p className="mb-2 font-medium text-slate-800">2. Timeliness &amp; Tardiness</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Training hours: <strong>Monday–Friday, 7:00 a.m. – 4:00 p.m.</strong></li>
                    <li>Includes one-hour lunch and two 15-minute breaks</li>
                    <li>Students must arrive on time each day; excessive tardiness may result in removal</li>
                  </ul>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm text-amber-800">
                    <strong>Note:</strong> Transportation to and from CDL training each day must be
                    provided by the student, employer, or agency funding the training.
                  </div>
                  <p className="mb-2 font-medium text-slate-800">3. Professional Conduct</p>
                  <p className="mb-4">
                    Students must comply with all facility rules, safety guidelines, and instructor
                    direction at all times.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">VI. Job Placement Support</h3>
                  <p className="mb-2 font-medium text-slate-800">1. Job Placement Coordination</p>
                  <p className="mb-3">
                    Each student will be assigned a Job Placement Coordinator who will provide
                    guidance on employment opportunities and carrier partnerships.
                  </p>
                  <p className="mb-2 font-medium text-slate-800">2. Career Preparation</p>
                  <p className="mb-4">
                    Students will be introduced to job opportunities beginning on day one.
                    Representatives from partner carriers will regularly present to classes
                    throughout training.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">VII. Drop &amp; Dismissal Policy</h3>
                  <p className="mb-2">A student may be dismissed for any of the following:</p>
                  <ol className="list-decimal pl-5 space-y-1 mb-4">
                    <li>Failure to meet attendance or timeliness requirements</li>
                    <li>Insufficient progress or inability to meet skill requirements</li>
                    <li>Failure or refusal of required drug screening</li>
                    <li>Violation of safety rules or conduct standards, as determined by program leadership</li>
                  </ol>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">VIII. Participant Ownership &amp; Non-Solicitation</h3>
                  <p className="mb-4">
                    All participants referred to {orgName} remain enrolled students of Elevate for
                    Humanity. {orgName} may not bypass, independently solicit, or retain
                    participants outside the terms of this agreement. Any attempt to redirect
                    participants to a competing program or circumvent Elevate&apos;s enrollment and
                    funding processes constitutes a material breach of this MOU.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">IX. Responsibilities</h3>
                  <p className="mb-2 font-medium text-slate-800">{PLATFORM_DEFAULTS.orgName}</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Participant recruitment and enrollment</li>
                    <li>Program administration and coordination</li>
                    <li>Compliance reporting to funding agencies</li>
                  </ul>
                  <p className="mb-2 font-medium text-slate-800">{orgName} (Training Provider)</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Deliver all CDL training: classroom, range, and road instruction</li>
                    <li>Provide qualified CDL instructors holding applicable federal and Indiana state licenses</li>
                    <li>Supply all vehicles, equipment, and materials necessary for training</li>
                    <li>Prepare students for and administer CDL skills testing</li>
                    <li>Provide job placement assistance and employment support</li>
                    <li>Track and report student attendance, training hours, and milestone completions to Elevate weekly</li>
                    <li>Maintain a safe, FMCSA-compliant training environment at all times</li>
                    <li>Notify Elevate within 48 hours of any safety incident, withdrawal, or attendance risk</li>
                    <li>Ensure all training aligns with FMCSA ELDT regulations and applicable Indiana CDL standards</li>
                    <li>Maintain audit-ready records for all WIOA, FSSA, and funding requirements</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">X. Compensation &amp; Referral</h3>
                  <p className="mb-3">
                    Elevate receives a program administration and referral fee per enrolled
                    participant as agreed in writing prior to enrollment. {orgName} invoices
                    Elevate for the agreed training cost per participant. {orgName} must submit an
                    itemized cost breakdown including tuition, training, equipment, testing, and
                    administrative fees. No hidden fees are permitted.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">X-A. Non-Disclosure Agreement</h3>
                  <p className="mb-3">
                    Each party acknowledges that in the course of this partnership they may receive
                    or have access to confidential and proprietary information belonging to the
                    other party, including but not limited to student records and PII, curriculum
                    content, business strategies, pricing structures, funding relationships, and
                    vendor contracts.
                  </p>
                  <p className="mb-2">Both parties agree to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Hold all confidential information in strict confidence and not disclose it to any third party without prior written consent</li>
                    <li>Use confidential information solely for the purpose of fulfilling obligations under this MOU</li>
                    <li>Limit access to employees or contractors who have a need to know and are bound by equivalent confidentiality obligations</li>
                    <li>Promptly notify the other party of any unauthorized disclosure or suspected breach</li>
                    <li>Return or destroy all confidential materials upon termination of this MOU</li>
                  </ul>
                  <p className="mb-4">
                    These obligations survive termination for <strong>three (3) years</strong>.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">X-B. Non-Compete Agreement</h3>
                  <p className="mb-3">
                    In consideration of the partnership established under this MOU and access to
                    Elevate&apos;s proprietary curriculum, student pipeline, and funding
                    relationships, {orgName} agrees to the following restrictions during the term
                    of this MOU and for <strong>two (2) years</strong> following its termination:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>
                      <strong>No independent program delivery:</strong> {orgName} shall not
                      independently offer, market, or deliver any CDL training program that
                      directly competes with the program described in this MOU using curriculum,
                      materials, or methods derived from Elevate&apos;s proprietary content
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s funding partners:</strong> {orgName}{' '}
                      shall not directly solicit WorkOne, DOL, or any other funding agency
                      introduced through this partnership for the purpose of independently funding
                      a competing training program
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s students:</strong> {orgName} shall
                      not directly recruit or solicit students enrolled in Elevate programs to
                      enroll in a competing program operated by {orgName} or any affiliated entity
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s staff:</strong> {orgName} shall not
                      solicit, recruit, or hire any Elevate employee, contractor, or instructor
                      during the term of this MOU and for one (1) year following termination
                    </li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XI. Tuition Breakdown Requirement</h3>
                  <p className="mb-3">
                    Prior to enrollment of any participant, {orgName} must submit a complete
                    itemized tuition breakdown to Elevate for review and approval. The breakdown
                    must include a line-item cost for each of the following:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Tuition / instruction fees</li>
                    <li>Behind-the-wheel and range training hours (cost per hour or flat rate)</li>
                    <li>Road training hours (cost per hour or flat rate)</li>
                    <li>CDL skills test fee</li>
                    <li>Equipment and materials</li>
                    <li>Administrative fees (if any)</li>
                  </ul>
                  <p className="mb-4">
                    No fees may be added after the breakdown is approved. Any cost not disclosed in
                    the approved breakdown is not payable under this agreement. Elevate reserves
                    the right to reject or renegotiate any line item before approving enrollment.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XII. Reporting &amp; Payout Process</h3>
                  <p className="mb-2 font-medium text-slate-800">Reporting Requirements</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Daily attendance records must be maintained for every training session</li>
                    <li>Weekly progress reports must be submitted to Elevate every Friday by 5:00 p.m.</li>
                    <li>Reports must include: student name, days attended, training phase completed, and any concerns</li>
                    <li>{orgName} must alert Elevate within <strong>48 hours</strong> of any attendance risk, withdrawal, or performance concern</li>
                    <li>Failure to submit required reports on time will delay invoice processing until all records are received and verified</li>
                  </ul>
                  <p className="mb-2 font-medium text-slate-800">Payout Process</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li><strong>Payment 1 — 50%:</strong> Invoiced after Elevate confirms verified student start and a valid funding voucher has been issued by the funding agency</li>
                    <li><strong>Payment 2 — 50%:</strong> Invoiced after Elevate confirms program completion with supporting documentation (final attendance record, skills test result, completion certificate)</li>
                    <li>All invoices must be submitted to Elevate with required documentation attached</li>
                    <li>Elevate will process payment within <strong>10 business days</strong> of receiving funds from the funding source</li>
                    <li>Elevate is not liable for delays caused by WorkOne, DOL, or any other funding agency</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XIII. Refund Policy</h3>
                  <p className="mb-3">
                    All refund determinations, funding adjustments, attendance compliance
                    determinations, and participant eligibility decisions shall be administered
                    solely by {PLATFORM_DEFAULTS.orgName} in accordance with institutional policies and
                    workforce development guidelines. Payments to the Program Holder are tied to
                    verified student participation as follows:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mb-4">
                    <div className="grid grid-cols-2 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-4 py-2">
                      <div>Student Status at Withdrawal</div>
                      <div>Program Holder Payment Obligation</div>
                    </div>
                    <div className="divide-y divide-slate-200">
                      <div className="grid grid-cols-2 px-4 py-2.5 text-sm">
                        <div className="font-medium text-slate-700">No-show / never started</div>
                        <div className="text-slate-600">No payment issued — full refund if already paid</div>
                      </div>
                      <div className="grid grid-cols-2 px-4 py-2.5 text-sm">
                        <div className="font-medium text-slate-700">0–25% completion</div>
                        <div className="text-slate-600">Prorated based on verified attendance hours</div>
                      </div>
                      <div className="grid grid-cols-2 px-4 py-2.5 text-sm">
                        <div className="font-medium text-slate-700">25–75% completion</div>
                        <div className="text-slate-600">Increment 1 retained; Increment 2 forfeited</div>
                      </div>
                      <div className="grid grid-cols-2 px-4 py-2.5 text-sm">
                        <div className="font-medium text-slate-700">75%+ completion</div>
                        <div className="text-slate-600">Full payment issued upon documentation</div>
                      </div>
                    </div>
                  </div>
                  <p className="mb-3">
                    Students are not responsible for direct payment to {orgName} under this
                    agreement. All student payments are processed exclusively through Elevate for
                    Humanity.
                  </p>
                  <p className="mb-4">
                    If Elevate has already paid {orgName} and a student subsequently withdraws,
                    is dismissed, or a funding reversal occurs, {orgName} must return the
                    overpaid amount to Elevate within <strong>10 business days</strong> of written
                    notification. Failure to return funds within this window constitutes a material
                    breach of this MOU and may result in immediate termination and legal action to
                    recover funds.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XIV. Compliance</h3>
                  <p className="mb-4">
                    {orgName} must comply with WIOA, FSSA, FMCSA ELDT regulations, and all
                    applicable funding source requirements. All records must be audit-ready.
                    {orgName} operates under Elevate&apos;s compliance system; Elevate&apos;s rules
                    take precedence. {orgName} is liable for any compliance failures attributable
                    to its training operations.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XV. Audit Rights</h3>
                  <p className="mb-4">
                    Elevate may audit {orgName}&apos;s records, attendance documentation, training
                    logs, and performance data at any time with reasonable notice. {orgName} agrees
                    to cooperate fully with any audit request.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XVI. Invoicing</h3>
                  <p className="mb-4">
                    All invoices must include supporting documentation (attendance records,
                    completion evidence, itemized costs) and align with funding approvals on file.
                    Invoices without required documentation will not be processed until complete.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XVII. Confidentiality</h3>
                  <p className="mb-4">
                    Both parties agree to protect all participant PII, business data, pricing
                    structures, funding relationships, and proprietary program materials. Neither
                    party shall disclose confidential information to any third party without prior
                    written consent. These obligations survive termination for{' '}
                    <strong>three (3) years</strong>.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XVIII. Termination</h3>
                  <p className="mb-4">
                    Either party may terminate with <strong>30 days</strong> written notice.
                    Elevate may terminate immediately upon material breach, including
                    non-compliance with funding requirements, failure to report, solicitation of
                    Elevate&apos;s participants, or safety violations. Termination does not affect
                    obligations for students already enrolled.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XIX. Independent Contractors</h3>
                  <p className="mb-4">
                    Nothing in this MOU creates an employment relationship, joint venture,
                    partnership, or agency between Elevate and {orgName}. Each party is solely
                    responsible for its own employees, taxes, insurance, and liabilities.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">XX. Agreement &amp; Acknowledgement</h3>
                  <p className="mb-3">
                    By participating in this program, the student acknowledges and agrees to the
                    terms, expectations, and responsibilities outlined in this MOU.
                  </p>
                  <p className="mb-3">
                    Companies, employers, agencies, and funding partners entering into this MOU
                    alongside the student confirm that the individual enrolling has demonstrated a
                    responsibility and willingness to uphold the requirements outlined in this
                    document. By entering into this agreement, they are also assuming{' '}
                    <strong>financial responsibility</strong> on behalf of the student receiving
                    instruction and training.
                  </p>

                  <div className="border-t border-slate-200 pt-6 mt-4 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
                        C1 Truck Driver Training
                      </p>
                      <div className="border-b border-slate-400 h-8 mb-1" />
                      <p className="text-xs text-slate-500">Authorized Signature &amp; Date</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">
                        {PLATFORM_DEFAULTS.orgName}
                      </p>
                      <div className="border-b border-slate-400 h-8 mb-1" />
                      <p className="text-xs text-slate-500">Elizabeth Greene, Founder &amp; CEO</p>
                    </div>
                  </div>
                </>
              ) : (
                /* Universal MOU — all other program holders */
                <>
                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">1. Purpose</h3>
                  <p className="mb-4">
                    The purpose of this MOU is to establish a partnership for the delivery of
                    workforce training programs through Elevate&apos;s learning management platform.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    2. Program Holder Responsibilities
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Recruit and enroll eligible participants into approved program tracks</li>
                    <li>Provide participant support services including case management</li>
                    <li>
                      Ensure all training meets Elevate&apos;s quality and compliance standards
                    </li>
                    <li>
                      Track and report outcomes: enrollment, completion, credentials, placement
                    </li>
                    <li>Maintain accurate records for grant compliance and audit purposes</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    3. Elevate Responsibilities
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Provide LMS platform access for training delivery and progress tracking</li>
                    <li>Issue industry-recognized credentials upon program completion</li>
                    <li>Provide reporting tools for grant compliance and outcome tracking</li>
                    <li>Offer technical support and onboarding assistance</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    4. Non-Disclosure Agreement
                  </h3>
                  <p className="mb-3">
                    Each party acknowledges that in the course of this partnership they may receive
                    or have access to confidential and proprietary information belonging to the
                    other party, including but not limited to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>
                      Student records, enrollment data, and personally identifiable information
                      (PII)
                    </li>
                    <li>
                      Curriculum content, course materials, assessments, and LMS platform
                      architecture
                    </li>
                    <li>
                      Business strategies, pricing structures, funding relationships, and financial
                      terms
                    </li>
                    <li>Vendor contracts, partner agreements, and operational processes</li>
                  </ul>
                  <p className="mb-3">Both parties agree to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>
                      Hold all confidential information in strict confidence and not disclose it to
                      any third party without prior written consent
                    </li>
                    <li>
                      Use confidential information solely for the purpose of fulfilling obligations
                      under this MOU
                    </li>
                    <li>
                      Limit access to confidential information to employees or contractors who have
                      a need to know and are bound by equivalent confidentiality obligations
                    </li>
                    <li>
                      Promptly notify the other party of any unauthorized disclosure or suspected
                      breach
                    </li>
                    <li>
                      Return or destroy all confidential materials upon termination of this MOU
                    </li>
                  </ul>
                  <p className="mb-4">
                    These obligations survive termination of this MOU for a period of{' '}
                    <strong>three (3) years</strong>. Confidential information does not include
                    information that is publicly available through no fault of the receiving party,
                    independently developed without reference to the disclosing party&apos;s
                    information, or required to be disclosed by law or court order.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    5. Non-Compete Agreement
                  </h3>
                  <p className="mb-3">
                    In consideration of the partnership established under this MOU and access to
                    Elevate&apos;s proprietary curriculum, student pipeline, funding relationships,
                    and program infrastructure, Program Holder agrees to the following restrictions
                    during the term of this MOU and for a period of <strong>two (2) years</strong>{' '}
                    following its termination:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>
                      <strong>No independent program delivery:</strong> Program Holder shall not
                      independently offer, market, or deliver any training program that directly
                      competes with programs described in this MOU using curriculum, materials, or
                      methods derived from Elevate&apos;s proprietary content
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s funding partners:</strong> Program
                      Holder shall not directly solicit WorkOne, DOL, or any other funding agency
                      introduced through this partnership for the purpose of independently funding a
                      competing training program
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s students:</strong> Program Holder
                      shall not directly recruit or solicit students enrolled in Elevate programs to
                      enroll in a competing program operated by Program Holder or any affiliated
                      entity
                    </li>
                    <li>
                      <strong>No solicitation of Elevate&apos;s staff or instructors:</strong>{' '}
                      Program Holder shall not solicit, recruit, or hire any Elevate employee,
                      contractor, or instructor during the term of this MOU and for one (1) year
                      following termination
                    </li>
                  </ul>
                  <p className="mb-4">
                    If any provision of this section is found unenforceable, it shall be modified to
                    the minimum extent necessary to make it enforceable, and the remaining
                    provisions shall remain in full force.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">6. Compliance</h3>
                  <p className="mb-4">
                    Program Holder agrees to comply with all applicable federal, state, and local
                    laws including WIOA requirements where applicable, and will not discriminate
                    against any participant on the basis of race, color, religion, sex, national
                    origin, disability, or age.
                  </p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">
                    7. Term &amp; Termination
                  </h3>
                  <p>
                    This MOU is effective upon signing and remains in effect for one (1) year,
                    renewable annually. Either party may terminate with 30 days written notice.
                  </p>
                </>
              )}
            </div>

            <MOUSignClient holderName={orgName} />
          </>
        )}
      </div>
    </div>
  );
}
