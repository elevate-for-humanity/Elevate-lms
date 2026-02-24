
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Barbering Apprenticeship Agreement | Elevate for Humanity',
  description: 'Formal apprenticeship agreement for workplace-based barber training. Defines RTI, OJT, supervision, competency evaluation, roles, and completion requirements. RAPIDS ID: 2025-IN-132301.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber/apprenticeship-agreement' },
};

export default function ApprenticeshipAgreementPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white print:text-[11px]">
      {/* Screen nav */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Competency Verification', href: '/compliance/competency-verification' },
            { label: 'Barber', href: '/compliance/competency-verification/barber' },
            { label: 'Apprenticeship Agreement' },
          ]} />
        </div>
      </div>

      {/* Screen header */}
      <div className="print:hidden py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Barbering Apprenticeship Agreement</h1>
          <p className="text-gray-600 mb-4">
            Formal agreement for each barber apprentice enrollment. Print, complete, and store signed copies in the compliance folder.
          </p>
          <PrintButton />
        </div>
      </div>

      {/* Agreement document */}
      <div className="max-w-3xl mx-auto px-4 pb-12 print:px-8 print:pb-0 print:max-w-none">
        {/* Document header */}
        <div className="text-center border-b-2 border-gray-900 pb-6 mb-6 print:pb-4 print:mb-4">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2 print:text-[9px]">Elevate for Humanity Career & Technical Institute</p>
          <h2 className="text-2xl font-bold text-gray-900 print:text-xl">BARBERING APPRENTICESHIP AGREEMENT</h2>
          <p className="text-sm text-gray-600 mt-1 print:text-[10px]">Workplace-Based Apprenticeship Program</p>
          <p className="text-xs text-gray-500 mt-1 print:text-[9px]">RAPIDS Registration: 2025-IN-132301 | Occupation: Barber (DOT 330.371-010)</p>
        </div>

        {/* Parties */}
        <div className="mb-8 print:mb-5">
          <p className="text-sm text-gray-700 mb-4 print:text-[10px] print:mb-3">
            This Apprenticeship Agreement is entered into between the following parties:
          </p>
          <div className="space-y-3 text-sm print:text-[10px] print:space-y-2">
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Sponsor / Program Administrator:</span>
              <span>Elevate for Humanity Career & Technical Institute</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Apprentice:</span>
              <span className="border-b border-gray-400 min-w-[200px]">&nbsp;</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Employer (Licensed Barbershop):</span>
              <span className="border-b border-gray-400 min-w-[200px]">&nbsp;</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Licensed Supervisor Barber:</span>
              <span className="border-b border-gray-400 min-w-[200px]">&nbsp;</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Program Holder (RTI Coordinator):</span>
              <span className="border-b border-gray-400 min-w-[200px]">&nbsp;</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Credential Partner (RTI Provider):</span>
              <span className="border-b border-gray-400 min-w-[200px]">&nbsp;</span>
            </div>
            <div className="grid grid-cols-[200px_1fr] gap-2 print:grid-cols-[160px_1fr]">
              <span className="font-semibold text-gray-900">Effective Date:</span>
              <span className="border-b border-gray-400 min-w-[200px]">&nbsp;</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed print:text-[10px] print:space-y-4 print:leading-snug">

          {/* Section 1 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">1. PURPOSE</h3>
            <p>
              This agreement establishes a structured barbering apprenticeship combining Related Technical
              Instruction (RTI) and On-the-Job Training (OJT) in a licensed barbershop environment under
              supervised, competency-based training standards. The apprenticeship is registered with the
              U.S. Department of Labor under RAPIDS ID 2025-IN-132301 and aligned with Indiana Professional
              Licensing Agency (PLA) requirements for barber licensure.
            </p>
          </section>

          {/* Section 2 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">2. PROGRAM STRUCTURE</h3>
            <p className="mb-2">The apprenticeship program consists of:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Related Technical Instruction (RTI) delivered by licensed credential partners and supervised curriculum modules through the institutional LMS</li>
              <li>On-the-Job Training (OJT) conducted at an approved licensed barbershop under the direct supervision of a licensed barber</li>
              <li>Competency tracking through the institutional LMS and standardized evaluation rubrics</li>
              <li>Oversight by Program Holders (RTI Coordinators) and Sponsor (Elevate for Humanity)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">3. TRAINING HOURS</h3>
            <div className="border rounded-lg p-4 print:p-2 print:border-gray-400">
              <div className="grid grid-cols-2 gap-3 print:gap-2">
                <div>Total RTI Hours: <span className="border-b border-gray-400 inline-block min-w-[80px]">&nbsp;</span></div>
                <div>Total OJT Hours: <span className="border-b border-gray-400 inline-block min-w-[80px]">&nbsp;</span></div>
                <div>Total Program Hours: <span className="border-b border-gray-400 inline-block min-w-[80px]">&nbsp;</span></div>
                <div>Estimated Duration: <span className="border-b border-gray-400 inline-block min-w-[80px]">&nbsp;</span></div>
              </div>
            </div>
            <p className="mt-2">
              Training shall follow a mapped work process schedule aligned with barbering competencies
              including sanitation, cutting techniques, shaving, shop operations, and professional conduct.
              Hour requirements are fixed minimums regardless of delivery location.
            </p>
          </section>

          {/* Section 4 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">4. RELATED TECHNICAL INSTRUCTION (RTI)</h3>
            <p className="mb-2">RTI will be provided through:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Licensed credential partners (state-approved barber schools or licensed instructors)</li>
              <li>Structured LMS modules with tracked completion and assessment</li>
              <li>Instructor-led instruction, demonstrations, and competency assessments</li>
            </ul>
            <p className="mb-2">RTI curriculum includes:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Sanitation and safety standards (Indiana PLA and OSHA)</li>
              <li>Barbering theory and hair science</li>
              <li>Indiana state board compliance and barber law (IC 25-7)</li>
              <li>Technical skill instruction (clipper, shear, razor techniques)</li>
              <li>Chemical services safety and application</li>
              <li>Professional development and business operations</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">5. ON-THE-JOB TRAINING (OJT)</h3>
            <p className="mb-2">The Employer agrees to provide supervised workplace training including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Haircut and styling techniques on real clients</li>
              <li>Client consultation and service delivery</li>
              <li>Shop sanitation and hygiene maintenance</li>
              <li>Equipment usage, maintenance, and safety</li>
              <li>Straight razor shaving and beard grooming</li>
              <li>Appointment management and shop workflow</li>
            </ul>
            <p className="mt-2">
              All OJT must occur under the direct supervision of a licensed barber at a licensed barbershop.
              OJT hours are logged by competency category and verified by the supervising barber.
            </p>
          </section>

          {/* Section 6 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">6. SUPERVISION REQUIREMENTS</h3>
            <p className="mb-2">The Employer shall ensure:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Active Indiana barbershop license maintained throughout the apprenticeship</li>
              <li>Licensed barber supervision present at all times during apprentice training</li>
              <li>Safe, sanitary, and compliant training environment per Indiana PLA standards</li>
              <li>Monthly performance evaluations using standardized evaluation forms</li>
              <li>Cooperation with Program Holder and Sponsor for progress reviews</li>
            </ul>
            <div className="border rounded-lg p-4 print:p-2 print:border-gray-400">
              <p className="font-semibold text-gray-900 mb-2">Licensed Supervisor Information</p>
              <div className="grid grid-cols-2 gap-3 print:gap-2">
                <div>Supervisor Name: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
                <div>Indiana Barber License #: <span className="border-b border-gray-400 inline-block min-w-[100px]">&nbsp;</span></div>
                <div>Years Licensed: <span className="border-b border-gray-400 inline-block min-w-[60px]">&nbsp;</span></div>
                <div>Shop License #: <span className="border-b border-gray-400 inline-block min-w-[100px]">&nbsp;</span></div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">7. COMPETENCY-BASED EVALUATION</h3>
            <p className="mb-2">
              Apprentice progress will be evaluated using standardized competency rubrics covering six sections:
            </p>
            <ol className="list-decimal pl-6 space-y-1 mb-3">
              <li>Sanitation, Safety & State Board Compliance</li>
              <li>Clipper & Cutting Technique</li>
              <li>Shaving & Razor Techniques</li>
              <li>Client Services & Professionalism</li>
              <li>Shop Operations & Business Readiness</li>
              <li>OJT Performance Evaluation</li>
            </ol>
            <p className="mb-2">Scoring scale: 0 (Not Demonstrated) through 5 (Independent Mastery). Minimum passing standard: score of 3 (Competent) in all core competencies.</p>
            <p>Evaluations will be conducted at the following checkpoints:</p>
            <ul className="list-disc pl-6 space-y-1 mt-1">
              <li><strong>Monthly:</strong> OJT evaluation by barbershop supervisor</li>
              <li><strong>Quarterly:</strong> Combined RTI + OJT review by instructor and supervisor</li>
              <li><strong>Final:</strong> Tri-party competency sign-off (RTI Instructor + Employer + Program Holder + Sponsor)</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">8. PROGRESS TRACKING & DOCUMENTATION</h3>
            <p className="mb-2">All training hours, competencies, and assessments will be documented through:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Institutional LMS tracking system (RTI hours, module completion, assessment scores)</li>
              <li>Employer OJT logs (hours by competency category, supervisor verification)</li>
              <li>Instructor RTI assessments (technical and theoretical competency verification)</li>
              <li>Program Holder oversight reviews (rubric completion, checkpoint compliance)</li>
              <li>Monthly OJT evaluation forms (standardized, signed by supervisor and apprentice)</li>
            </ul>
            <p className="mt-2">
              The LMS serves as the single system of record. All parties have access to progress data
              relevant to their role.
            </p>
          </section>

          {/* Section 9 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">9. ROLES AND RESPONSIBILITIES</h3>
            <div className="space-y-3 print:space-y-2">
              {[
                { role: 'Sponsor (Elevate for Humanity)', duties: 'Program oversight, RAPIDS registration and documentation, LMS tracking, completion verification, credential coordination, funding navigation, career services' },
                { role: 'Credential Partner (RTI Provider)', duties: 'Classroom and module-based instruction, academic evaluation, technical competency verification, state board exam preparation, RTI attendance documentation' },
                { role: 'Employer (Licensed Barbershop)', duties: 'Hands-on workplace training, OJT supervision by licensed barber, monthly performance evaluations, safe training environment, OJT hour logging' },
                { role: 'Program Holder (RTI Coordinator)', duties: 'RTI scheduling and coordination, progress monitoring, rubric completion enforcement, LMS documentation oversight, evaluation checkpoint management' },
                { role: 'Apprentice', duties: 'Active participation in all RTI and OJT activities, consistent attendance, skill development, adherence to professional and safety standards, completion of all assessments and evaluations' },
              ].map((item, i) => (
                <div key={i} className="border-l-2 border-gray-300 pl-3 print:pl-2">
                  <p className="font-semibold text-gray-900">{item.role}</p>
                  <p className="text-gray-600">{item.duties}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 10 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">10. CREDENTIAL & COMPLETION</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Indiana Barber License is issued by the Indiana Professional Licensing Agency (PLA) upon successful completion of the state board examination. Elevate does not issue this credential.</li>
              <li>Elevate will issue a Certificate of Completion upon successful fulfillment of all RTI hours, OJT hours, and competency requirements.</li>
              <li>Upon completion of all registered apprenticeship requirements, a Certificate of Completion of Apprenticeship will be filed through the USDOL RAPIDS system.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">11. ATTENDANCE & CONDUCT</h3>
            <p className="mb-2">The apprentice agrees to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintain consistent attendance for all scheduled RTI sessions and OJT shifts</li>
              <li>Provide advance notice for any absences</li>
              <li>Follow all workplace policies of the employer barbershop</li>
              <li>Comply with sanitation and safety standards at all times</li>
              <li>Demonstrate professional conduct with clients, coworkers, and supervisors</li>
              <li>Complete all assigned LMS modules and assessments by scheduled deadlines</li>
            </ul>
            <p className="mt-2">
              Failure to meet conduct or competency standards may result in a remediation plan,
              additional training requirements, or program review by the Sponsor.
            </p>
          </section>

          {/* Section 12 */}
          <section className="print:break-inside-avoid">
            <h3 className="font-bold text-gray-900 text-base mb-2 print:text-[11px] print:mb-1">12. TERMINATION OR MODIFICATION</h3>
            <p className="mb-2">This agreement may be modified or terminated based on:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Non-compliance with training standards or competency requirements</li>
              <li>Safety violations or sanitation non-compliance</li>
              <li>Employer or apprentice voluntary withdrawal (with written notice)</li>
              <li>Loss of shop license or supervisor license</li>
              <li>Program review by Sponsor resulting in structural changes</li>
            </ul>
            <p className="mt-2">
              Any modification or termination will be documented and filed with the apprenticeship record.
              The apprentice retains credit for all verified hours and competencies completed prior to termination.
            </p>
          </section>

          {/* Section 13: Signatures */}
          <section className="print:break-before-page">
            <h3 className="font-bold text-gray-900 text-base mb-4 print:text-[11px] print:mb-3">13. SIGNATURES</h3>
            <p className="mb-4 print:mb-3">
              By signing below, all parties acknowledge and agree to the terms of this Apprenticeship Agreement.
            </p>

            <div className="space-y-6 print:space-y-4">
              {[
                { role: 'Apprentice', fields: ['Print Name', 'Signature', 'Date', 'Phone', 'Email'] },
                { role: 'Employer / Barbershop Representative', fields: ['Print Name', 'Title', 'Shop Name', 'Shop License #', 'Signature', 'Date'] },
                { role: 'Licensed Supervisor Barber', fields: ['Print Name', 'Indiana Barber License #', 'Years Licensed', 'Signature', 'Date'] },
                { role: 'Credential Partner Representative (RTI Provider)', fields: ['Print Name', 'Organization', 'License/Accreditation #', 'Signature', 'Date'] },
                { role: 'Program Holder (RTI Coordinator)', fields: ['Print Name', 'Title', 'Signature', 'Date'] },
                { role: 'Sponsor — Elevate for Humanity', fields: ['Authorized Representative', 'Title', 'Signature', 'Date'] },
              ].map((signer, i) => (
                <div key={i} className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400 print:break-inside-avoid">
                  <p className="font-bold text-gray-900 mb-3 print:text-[11px] print:mb-2">{signer.role}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                    {signer.fields.map((field, fi) => (
                      <div key={fi} className={field === 'Signature' ? 'col-span-2' : ''}>
                        {field}: <span className="border-b border-gray-400 inline-block min-w-[180px] print:min-w-[140px]">&nbsp;</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Document footer */}
          <div className="border-t-2 border-gray-900 pt-4 mt-8 text-center text-xs text-gray-500 print:text-[9px] print:pt-3 print:mt-4">
            <p>Elevate for Humanity Career & Technical Institute</p>
            <p>RAPIDS Registration: 2025-IN-132301 | Indianapolis, Indiana</p>
            <p className="mt-1">This agreement is maintained in the apprentice compliance file and filed with RAPIDS documentation.</p>
          </div>
        </div>
      </div>

      {/* Screen nav */}
      <div className="py-8 bg-slate-50 print:hidden">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-3">
          <Link href="/compliance/competency-verification/barber" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
            Barber Rubric Overview
          </Link>
          <Link href="/compliance/competency-verification/barber/scoring-sheet" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Scoring Sheet
          </Link>
          <Link href="/compliance/competency-verification/barber/monthly-ojt-evaluation" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Monthly OJT Evaluation
          </Link>
          <Link href="/compliance/competency-verification/barber/final-signoff" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Final Sign-Off Form
          </Link>
        </div>
      </div>
    </div>
  );
}
