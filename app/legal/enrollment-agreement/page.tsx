import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Enrollment Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function EnrollmentAgreementPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Enrollment Agreement' }]} />
      </div>
      <DocumentPage
        documentType="Enrollment Agreement"
        title="Student Enrollment Agreement"
        subtitle="Elevate for Humanity Career & Training Institute"
        date="2025-01-01"
        version="1.0"
      >
        <DocumentSection heading="Parties" number={1}>
          <p>
            This Enrollment Agreement is entered into between <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong> ("Elevate"), located at 8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240, and the student identified during enrollment ("Student").
          </p>
        </DocumentSection>

        <DocumentSection heading="Program of Enrollment" number={2}>
          <p>
            The Student is enrolling in a career training program offered by Elevate for Humanity. The specific program, start date, schedule, and total hours are confirmed at the time of enrollment and reflected in the Student's enrollment record.
          </p>
        </DocumentSection>

        <DocumentSection heading="Tuition and Fees" number={3}>
          <p>
            Tuition and fees vary by program. Students may be eligible for funding through WIOA, the Workforce Ready Grant (WRG), Job Ready Indy, JRI, DOL Registered Apprenticeship, or other sources. Students are responsible for any balance not covered by approved funding.
          </p>
          <ul>
            <li>Tuition is due prior to the program start date unless a payment plan or funding approval is in place</li>
            <li>Exam fees, materials, and credential fees may be separate from tuition</li>
            <li>Refund policy is outlined in Section 7 below</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Attendance Requirements" number={4}>
          <p>
            Students must maintain a minimum attendance rate of 80% of scheduled sessions. Absences must be reported to the program coordinator within 24 hours. Three consecutive unexcused absences may result in probation or dismissal.
          </p>
        </DocumentSection>

        <DocumentSection heading="Academic Standards and Conduct" number={5}>
          <ul>
            <li>Complete all assignments and assessments by their due dates</li>
            <li>Maintain satisfactory academic progress as defined by the program</li>
            <li>Treat all students, staff, instructors, and employer partners with respect</li>
            <li>Follow all safety protocols during hands-on training</li>
            <li>No use of alcohol, drugs, or weapons on any training site</li>
            <li>Do not share LMS login credentials with others</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Credentials and Certification" number={6}>
          <p>
            Upon successful completion of the program and all required assessments, the Student will receive an Elevate for Humanity completion certificate. Industry certifications (EPA 608, CompTIA, PTCB, etc.) are issued by their respective certifying bodies upon passing the applicable exam. Elevate does not guarantee exam passage.
          </p>
        </DocumentSection>

        <DocumentSection heading="Refund Policy" number={7}>
          <ul>
            <li><strong>Before program start:</strong> Full refund of tuition paid, minus a $50 administrative fee</li>
            <li><strong>Within the first week:</strong> 75% refund of tuition</li>
            <li><strong>After week one:</strong> No refund. Students who withdraw after week one remain responsible for the full tuition balance</li>
            <li>Funding agency refund requirements supersede this policy where applicable</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="FERPA and Data Privacy" number={8}>
          <p>
            Student educational records are protected under the Family Educational Rights and Privacy Act (FERPA). Elevate may share records with workforce agencies, funding bodies, and employer partners as required for program compliance and funding verification. See the FERPA Consent form for full details.
          </p>
        </DocumentSection>

        <DocumentSection heading="Grievance Procedure" number={9}>
          <p>
            Students who have a complaint or grievance should first attempt to resolve the matter with their program coordinator. If unresolved, the Student may submit a written grievance to the Program Director at <strong>info@elevateforhumanity.org</strong>. Elevate will respond within 10 business days.
          </p>
        </DocumentSection>

        <DocumentSection heading="Termination" number={10}>
          <p>
            Elevate reserves the right to dismiss a Student for violation of conduct standards, excessive absences, non-payment of tuition, or other cause. The Student may withdraw at any time by providing written notice to the program coordinator. Refund eligibility is governed by Section 7.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law" number={11}>
          <p>
            This Agreement is governed by the laws of the State of Indiana. Any disputes shall be resolved in Marion County, Indiana.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={12}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="enrollment"
          agreementVersion="1.0"
          buttonLabel="Sign Enrollment Agreement"
          nextUrl="/student-portal/onboarding"
        />
      </DocumentPage>
    </>
  );
}
