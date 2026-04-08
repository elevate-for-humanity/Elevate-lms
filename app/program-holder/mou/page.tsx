import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle } from 'lucide-react';
import MOUSignClient from './MOUSignClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign Your MOU | Elevate For Humanity',
  description: 'Review and sign your Program Holder Memorandum of Understanding.',
};

export default async function ProgramHolderMOUPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/mou');

  const db = createAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('full_name, program_holder_id')
    .eq('id', user.id)
    .single();

  if (!profile?.program_holder_id) redirect('/program-holder/onboarding');

  const { data: holder } = await db
    .from('program_holders')
    .select('organization_name, contact_name, mou_signed, mou_signed_at, mou_status, mou_type')
    .eq('id', profile.program_holder_id)
    .single();

  if (!holder) redirect('/program-holder/onboarding');

  const orgName = holder.organization_name || profile.full_name || 'Your Organization';
  const isCustomHvac = holder.mou_type === 'custom_hvac_codelivery';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <nav className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-slate-500">
            <li><Link href="/program-holder/onboarding" className="hover:text-slate-700">Onboarding</Link></li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Memorandum of Understanding</li>
          </ol>
        </nav>

        {holder.mou_signed ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-800 mb-1">MOU Already Signed</h2>
            <p className="text-green-700 text-sm mb-2">
              Signed on {holder.mou_signed_at ? new Date(holder.mou_signed_at).toLocaleDateString() : 'file'}
            </p>
            <Link href="/program-holder/dashboard" className="inline-block mt-4 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Signature required before accessing your dashboard</p>
                <p className="text-xs text-amber-700 mt-0.5">Review the agreement below and sign to activate your program holder account.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-8 mb-2 text-slate-700 text-sm leading-relaxed">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Memorandum of Understanding</h2>
              <p className="text-xs text-slate-400 mb-6">Elevate for Humanity Career &amp; Technical Institute · 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>

              <p className="mb-4">This Memorandum of Understanding (&ldquo;MOU&rdquo;) is entered into between <strong>Elevate for Humanity Career &amp; Technical Institute</strong> (&ldquo;Elevate&rdquo;) and <strong>{orgName}</strong> (&ldquo;Program Holder&rdquo;).</p>

              {isCustomHvac ? (
                /* ── David Nazaire / First Class Training Center — HVAC Co-Delivery ── */
                <>
                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">1. Purpose</h3>
                  <p className="mb-4">The purpose of this MOU is to establish a co-delivery partnership for the HVAC Technician training program. Elevate and {orgName} each hold distinct and complementary responsibilities in delivering a complete, industry-recognized training experience to enrolled students.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">2. Elevate Responsibilities — Related Technical Instruction (RTI)</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Deliver all Related Technical Instruction (RTI) including online coursework, theory, code knowledge, and exam preparation through Elevate&apos;s LMS platform</li>
                    <li>Administer and proctor all written assessments and certification exams</li>
                    <li>Issue industry-recognized credentials and certificates of completion</li>
                    <li>Maintain all student enrollment records, progress tracking, and compliance reporting</li>
                    <li>Provide technical support and student success services throughout the program</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">3. Program Holder Responsibilities — Hands-On Training (OJT)</h3>
                  <p className="mb-3">{orgName} serves as the designated hands-on trainer for the HVAC Technician program. In this capacity, {orgName} is solely responsible for all practical, shop-floor, and on-the-job training components and agrees to the following:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Deliver all hands-on, practical, and on-the-job training (OJT) components of the HVAC program at a designated training facility</li>
                    <li>Provide qualified HVAC instructors who hold applicable trade licenses or certifications required by Indiana state law</li>
                    <li>Supply all tools, equipment, refrigerants, and materials necessary for practical training sessions</li>
                    <li>Maintain a safe, OSHA-compliant training environment for all students at all times</li>
                    <li>Supervise students directly during all hands-on sessions and evaluate their practical competency</li>
                    <li>Track and report student attendance, lab hours, and practical milestone completions to Elevate on a weekly basis</li>
                    <li>Ensure all hands-on training content aligns with EPA 608, OSHA 10, and applicable Indiana licensing standards</li>
                    <li>Notify Elevate within 24 hours of any student safety incident, withdrawal, or failure to meet attendance requirements</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">4. Program Fee, Voucher Funding, and Revenue Distribution</h3>
                  <p className="mb-3">The total program fee for each enrolled student shall be <strong>$5,000.00</strong>.</p>
                  <p className="mb-3">This program is funded through third-party voucher sources, including but not limited to WorkOne or other state and workforce funding agencies. Payment for enrolled students is not considered received until the voucher has been issued and processed by the funding agency.</p>
                  <p className="mb-2 font-medium text-slate-800">Payment is triggered upon confirmation of both of the following:</p>
                  <ol className="list-decimal pl-5 space-y-1 mb-4">
                    <li>The student has officially started the program (defined as attendance and participation beyond initial enrollment); <strong>and</strong></li>
                    <li>A valid funding voucher has been issued by WorkOne or the applicable agency.</li>
                  </ol>
                  <p className="mb-4">Upon confirmation of both conditions, Elevate shall invoice or process the voucher for payment.</p>
                  <p className="mb-2 font-medium text-slate-800">Revenue Distribution Timing</p>
                  <p className="mb-4">Payment to the Program Holder shall be rendered within <strong>ten (10) business days</strong> after Elevate receives funds from the voucher payment issued by WorkOne or the applicable funding source. It is acknowledged by both parties that voucher issuance typically occurs after the student has started the program and may be subject to processing timelines outside of Elevate&apos;s control.</p>
                  <p className="mb-2 font-medium text-slate-800">Revenue Split</p>
                  <p className="mb-3">Upon receipt of voucher funds, the $5,000.00 program fee shall be distributed as follows:</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-800">Elevate for Humanity Career &amp; Technical Institute</span>
                      <span className="font-bold text-slate-900">$2,400.50 (50%)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{orgName}</span>
                      <span className="font-bold text-slate-900">$2,400.50 (50%)</span>
                    </div>
                  </div>
                  <p className="mb-2 font-medium text-slate-800">Fee Breakdown &amp; Revenue Calculation</p>
                  <p className="mb-3">The total program fee is <strong>$5,000.00</strong> per student. Elevate deducts certification and testing costs before the revenue split is applied:</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-700">Total program fee</span>
                      <span className="font-medium text-slate-900">$5,000.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200 pl-4">
                      <span className="text-slate-500 text-xs">EPA 608 Universal exam + proctoring</span>
                      <span className="text-slate-500 text-xs">− $58.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200 pl-4">
                      <span className="text-slate-500 text-xs">OSHA 10 certification</span>
                      <span className="text-slate-500 text-xs">− $62.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200 pl-4">
                      <span className="text-slate-500 text-xs">CPR / AED certification</span>
                      <span className="text-slate-500 text-xs">− $53.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200 pl-4">
                      <span className="text-slate-500 text-xs">Practice testing materials</span>
                      <span className="text-slate-500 text-xs">− $26.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="font-medium text-slate-800">Net distributable amount</span>
                      <span className="font-bold text-slate-900">$4,801.00</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-700">Elevate share (50%)</span>
                      <span className="font-medium text-slate-900">$2,400.50</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="text-slate-700">Program Holder share (50%)</span>
                      <span className="font-bold text-emerald-700">$2,400.50</span>
                    </div>
                  </div>
                  <p className="mb-4">Certification and testing costs are managed and paid by Elevate. The 50/50 revenue split is applied to the net amount after these costs are deducted.</p>
                  <p className="mb-2 font-medium text-slate-800">Non-Standard Costs</p>
                  <p className="mb-4">Any retesting fees, replacement certifications, no-show fees, or additional charges resulting from student failure or rescheduling shall not be included in the standard program fee and are not subject to the 50/50 revenue split unless otherwise agreed in writing.</p>
                  <p className="mb-2 font-medium text-slate-800">Delays and Contingencies</p>
                  <p className="mb-4">Elevate shall not be held liable for delays in payment caused by WorkOne or other funding agencies. Payment to the Program Holder is strictly contingent upon receipt of funds from the funding source.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">5. Non-Disclosure Agreement</h3>
                  <p className="mb-3">Each party acknowledges that in the course of this partnership they may receive or have access to confidential and proprietary information belonging to the other party, including but not limited to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Student records, enrollment data, and personally identifiable information (PII)</li>
                    <li>Curriculum content, course materials, assessments, and LMS platform architecture</li>
                    <li>Business strategies, pricing structures, funding relationships, and financial terms</li>
                    <li>Vendor contracts, partner agreements, and operational processes</li>
                  </ul>
                  <p className="mb-3">Both parties agree to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Hold all confidential information in strict confidence and not disclose it to any third party without prior written consent</li>
                    <li>Use confidential information solely for the purpose of fulfilling obligations under this MOU</li>
                    <li>Limit access to confidential information to employees or contractors who have a need to know and are bound by equivalent confidentiality obligations</li>
                    <li>Promptly notify the other party of any unauthorized disclosure or suspected breach</li>
                    <li>Return or destroy all confidential materials upon termination of this MOU</li>
                  </ul>
                  <p className="mb-4">These obligations survive termination of this MOU for a period of <strong>three (3) years</strong>. Confidential information does not include information that is publicly available through no fault of the receiving party, independently developed without reference to the disclosing party&apos;s information, or required to be disclosed by law or court order.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">6. Non-Compete Agreement</h3>
                  <p className="mb-3">In consideration of the partnership established under this MOU and access to Elevate&apos;s proprietary curriculum, student pipeline, funding relationships, and program infrastructure, {orgName} agrees to the following restrictions during the term of this MOU and for a period of <strong>two (2) years</strong> following its termination:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li><strong>No independent program delivery:</strong> {orgName} shall not independently offer, market, or deliver any HVAC training program that directly competes with the program described in this MOU using curriculum, materials, or methods derived from Elevate&apos;s proprietary content</li>
                    <li><strong>No solicitation of Elevate&apos;s funding partners:</strong> {orgName} shall not directly solicit WorkOne, DOL, or any other funding agency introduced through this partnership for the purpose of independently funding a competing HVAC training program</li>
                    <li><strong>No solicitation of Elevate&apos;s students:</strong> {orgName} shall not directly recruit or solicit students enrolled in Elevate programs to enroll in a competing program operated by {orgName} or any affiliated entity</li>
                    <li><strong>No solicitation of Elevate&apos;s staff or instructors:</strong> {orgName} shall not solicit, recruit, or hire any Elevate employee, contractor, or instructor during the term of this MOU and for one (1) year following termination</li>
                  </ul>
                  <p className="mb-4">These restrictions apply within the state of Indiana. Nothing in this section prevents {orgName} from continuing to operate its existing HVAC contracting or service business, provided such activities do not involve the delivery of a competing training program using Elevate&apos;s proprietary materials or funding relationships. If any provision of this section is found unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full force.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">7. Compliance</h3>
                  <p className="mb-4">Both parties agree to comply with all applicable federal, state, and local laws, including WIOA requirements where applicable. Neither party shall discriminate against any participant on the basis of race, color, religion, sex, national origin, disability, or age.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">8. Term &amp; Termination</h3>
                  <p>This MOU is effective upon signing by both parties and remains in effect for one (1) year, renewable annually by mutual written agreement. Either party may terminate with 30 days written notice. Termination does not affect obligations for students already enrolled prior to the termination date.</p>
                </>
              ) : (
                /* ── Universal MOU — all other program holders ── */
                <>
                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">1. Purpose</h3>
                  <p className="mb-4">The purpose of this MOU is to establish a partnership for the delivery of workforce training programs through Elevate&apos;s learning management platform.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">2. Program Holder Responsibilities</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Recruit and enroll eligible participants into approved program tracks</li>
                    <li>Provide participant support services including case management</li>
                    <li>Ensure all training meets Elevate&apos;s quality and compliance standards</li>
                    <li>Track and report outcomes: enrollment, completion, credentials, placement</li>
                    <li>Maintain accurate records for grant compliance and audit purposes</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">3. Elevate Responsibilities</h3>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Provide LMS platform access for training delivery and progress tracking</li>
                    <li>Issue industry-recognized credentials upon program completion</li>
                    <li>Provide reporting tools for grant compliance and outcome tracking</li>
                    <li>Offer technical support and onboarding assistance</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">4. Non-Disclosure Agreement</h3>
                  <p className="mb-3">Each party acknowledges that in the course of this partnership they may receive or have access to confidential and proprietary information belonging to the other party, including but not limited to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li>Student records, enrollment data, and personally identifiable information (PII)</li>
                    <li>Curriculum content, course materials, assessments, and LMS platform architecture</li>
                    <li>Business strategies, pricing structures, funding relationships, and financial terms</li>
                    <li>Vendor contracts, partner agreements, and operational processes</li>
                  </ul>
                  <p className="mb-3">Both parties agree to:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Hold all confidential information in strict confidence and not disclose it to any third party without prior written consent</li>
                    <li>Use confidential information solely for the purpose of fulfilling obligations under this MOU</li>
                    <li>Limit access to confidential information to employees or contractors who have a need to know and are bound by equivalent confidentiality obligations</li>
                    <li>Promptly notify the other party of any unauthorized disclosure or suspected breach</li>
                    <li>Return or destroy all confidential materials upon termination of this MOU</li>
                  </ul>
                  <p className="mb-4">These obligations survive termination of this MOU for a period of <strong>three (3) years</strong>. Confidential information does not include information that is publicly available through no fault of the receiving party, independently developed without reference to the disclosing party&apos;s information, or required to be disclosed by law or court order.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">5. Non-Compete Agreement</h3>
                  <p className="mb-3">In consideration of the partnership established under this MOU and access to Elevate&apos;s proprietary curriculum, student pipeline, funding relationships, and program infrastructure, Program Holder agrees to the following restrictions during the term of this MOU and for a period of <strong>two (2) years</strong> following its termination:</p>
                  <ul className="list-disc pl-5 space-y-1 mb-3">
                    <li><strong>No independent program delivery:</strong> Program Holder shall not independently offer, market, or deliver any training program that directly competes with programs described in this MOU using curriculum, materials, or methods derived from Elevate&apos;s proprietary content</li>
                    <li><strong>No solicitation of Elevate&apos;s funding partners:</strong> Program Holder shall not directly solicit WorkOne, DOL, or any other funding agency introduced through this partnership for the purpose of independently funding a competing training program</li>
                    <li><strong>No solicitation of Elevate&apos;s students:</strong> Program Holder shall not directly recruit or solicit students enrolled in Elevate programs to enroll in a competing program operated by Program Holder or any affiliated entity</li>
                    <li><strong>No solicitation of Elevate&apos;s staff or instructors:</strong> Program Holder shall not solicit, recruit, or hire any Elevate employee, contractor, or instructor during the term of this MOU and for one (1) year following termination</li>
                  </ul>
                  <p className="mb-4">If any provision of this section is found unenforceable, it shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall remain in full force.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">6. Compliance</h3>
                  <p className="mb-4">Program Holder agrees to comply with all applicable federal, state, and local laws including WIOA requirements where applicable, and will not discriminate against any participant on the basis of race, color, religion, sex, national origin, disability, or age.</p>

                  <h3 className="font-semibold text-slate-800 mt-5 mb-2">7. Term &amp; Termination</h3>
                  <p>This MOU is effective upon signing and remains in effect for one (1) year, renewable annually. Either party may terminate with 30 days written notice.</p>
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
