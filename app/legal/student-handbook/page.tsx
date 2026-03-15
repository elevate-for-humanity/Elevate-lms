import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Student Handbook | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function StudentHandbookPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Student Handbook' }]} />
      </div>
      <DocumentPage
        documentType="Student Handbook Acknowledgment"
        title="Student Handbook"
        subtitle="Elevate for Humanity Career & Training Institute"
        date="2025-01-01"
        version="2.0"
      >
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg mb-6">
          <p className="font-bold text-red-900 text-sm mb-1">These policies are not up for negotiation.</p>
          <p className="text-red-800 text-sm">
            Every policy in this handbook applies to every student in every program. None of it is optional.
            If something is unclear, ask your program coordinator before your first session.
          </p>
        </div>

        <DocumentSection heading="Mission" number={1}>
          <p>
            Elevate for Humanity provides career training, credentialing, and job placement support to job
            seekers, returning citizens, veterans, and underserved communities across Indiana. Our programs
            are designed to get you employed in a skilled trade or career field with industry-recognized
            credentials. You are here because you chose to invest in yourself. We expect you to show up,
            do the work, and conduct yourself as the professional you are training to become.
          </p>
        </DocumentSection>

        <DocumentSection heading="Program Expectations" number={2}>
          <p>These are the minimum standards required to remain enrolled. They are not suggestions.</p>
          <ul>
            <li>Attend every scheduled session. Attendance is tracked and reported to funding agencies.</li>
            <li>Arrive on time. Arriving more than 15 minutes late counts as a half-absence.</li>
            <li>Complete all assignments, assessments, and hands-on competency demonstrations.</li>
            <li>Maintain professional conduct at all times — in class, at employer sites, and online.</li>
            <li>Communicate proactively. Contact your coordinator before missing a session, not after.</li>
            <li>Register with WorkOne if you are receiving WIOA funding. This is a federal requirement, not optional.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Attendance Policy" number={3}>
          <p>
            <strong>Minimum 80% attendance is required to remain in good standing.</strong> This is a
            condition of enrollment and, for funded students, a condition of your funding.
          </p>
          <ul>
            <li><strong>Excused absences:</strong> Notify your coordinator within 24 hours. Documentation may be required. Excused absences still count toward your attendance percentage.</li>
            <li><strong>Unexcused absences:</strong> Three consecutive unexcused absences result in a probation notice. A fourth may result in dismissal.</li>
            <li><strong>Tardiness:</strong> Arriving or leaving more than 15 minutes outside scheduled time counts as a half-absence.</li>
            <li><strong>WIOA-funded students:</strong> Attendance records are submitted to Indiana DWD. Falling below 80% may result in suspension of your funding. This is federal policy — Elevate cannot override it.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Code of Conduct" number={4}>
          <p>You are training to enter a professional field. These standards mirror what employers expect. Violating them reflects on your readiness for employment.</p>
          <ul>
            <li><strong>Treat everyone with respect.</strong> Harassment, bullying, or discrimination of any kind results in immediate dismissal.</li>
            <li><strong>No weapons, alcohol, or illegal substances</strong> on any training site or employer site, at any time. Violation results in immediate dismissal with no appeal.</li>
            <li><strong>No recording</strong> of instructors, staff, or fellow students without explicit consent.</li>
            <li><strong>Dress appropriately</strong> per your program's dress code. Your coordinator will provide specifics at orientation.</li>
            <li><strong>No sharing of LMS login credentials.</strong> Sharing your account is academic dishonesty.</li>
          </ul>
          <p><strong>Immediate dismissal — no warning — for:</strong> violence or threats of violence, possession of weapons or illegal substances on site, sexual harassment or assault, falsifying attendance or program records.</p>
        </DocumentSection>

        <DocumentSection heading="Academic Integrity" number={5}>
          <p>Your credentials mean something because they are earned. Cheating undermines that — for you and for every other student in the program.</p>
          <ul>
            <li>All submitted work must be your own.</li>
            <li>Plagiarism or cheating on any exam or assessment results in immediate dismissal from the program.</li>
            <li>AI-generated content submitted as your own original work is prohibited.</li>
            <li>Do not share exam questions, answers, or assessment materials with other students.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Technology and LMS" number={6}>
          <ul>
            <li>Access your coursework through the Elevate LMS at elevateforhumanity.org.</li>
            <li>Report technical issues to your program coordinator promptly — do not wait until a deadline.</li>
            <li>Do not use training devices for personal social media during class hours.</li>
            <li>Elevate is not responsible for personal devices brought to training sites.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Employer Site Days" number={7}>
          <p>Some programs include employer site days where students visit partner workplaces. During these visits:</p>
          <ul>
            <li>Follow all employer site rules and safety requirements without exception.</li>
            <li>Represent Elevate for Humanity professionally at all times.</li>
            <li>Complete all required site documentation before leaving.</li>
            <li>Report any incidents or concerns to your program coordinator immediately — same day.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Safety" number={8}>
          <ul>
            <li>Follow all safety protocols during hands-on training, especially in trades programs. These protocols exist because people get hurt when they are not followed.</li>
            <li>Wear required personal protective equipment (PPE) at all times when instructed. No exceptions.</li>
            <li>Report any unsafe conditions to your instructor immediately — do not wait.</li>
            <li>Emergency exits and procedures are reviewed at program orientation. Pay attention.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Your Rights as a Student" number={9}>
          <p>These rights are guaranteed. Elevate is obligated to honor them.</p>
          <ul>
            <li><strong>Right to a safe, respectful learning environment.</strong> No student should feel unsafe or disrespected at any Elevate training site.</li>
            <li><strong>Right to inspect your educational records under FERPA.</strong> You may request to view your records at any time. Contact your program coordinator.</li>
            <li><strong>Right to reasonable accommodations</strong> for documented disabilities under the ADA and Section 504. Request accommodations at enrollment — do not wait until you are struggling.</li>
            <li><strong>Right to file a grievance without retaliation.</strong> See Section 10.</li>
            <li><strong>Right to withdraw from the program at any time.</strong> See your enrollment agreement for the refund policy.</li>
            <li><strong>Right to nondiscrimination.</strong> Elevate does not discriminate on the basis of race, color, religion, sex, national origin, age, disability, or any other protected characteristic. This is federal law under WIOA Section 188.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Grievance Procedure" number={10}>
          <p>If you have a complaint about a student, instructor, staff member, or program condition:</p>
          <ul>
            <li><strong>Step 1:</strong> Speak with your program coordinator. Most issues are resolved here within 2 business days.</li>
            <li><strong>Step 2:</strong> If unresolved within 5 business days, submit a written grievance to elevate4humanityedu@gmail.com with subject line "Student Grievance."</li>
            <li><strong>Step 3:</strong> Elevate will respond in writing within 10 business days.</li>
            <li><strong>Step 4:</strong> If still unresolved, you may contact the Indiana Commission for Higher Education or the U.S. Department of Education.</li>
          </ul>
          <p>Filing a grievance will not affect your enrollment status and will not result in retaliation of any kind.</p>
        </DocumentSection>

        <DocumentSection heading="Disciplinary Process" number={11}>
          <p>For most violations: verbal warning → written warning → probation → dismissal. Serious violations (violence, weapons, drug use, falsifying records) result in immediate dismissal without warning.</p>
          <p>You have the right to respond in writing to any written warning or probation notice within 5 business days. Your response will be placed in your file and considered before any further action is taken.</p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={12}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: elevate4humanityedu@gmail.com · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="handbook"
          agreementVersion="2.0"
          buttonLabel="Acknowledge Student Handbook"
          nextUrl="/student-portal/onboarding"
        />
      </DocumentPage>
    </>
  );
}
