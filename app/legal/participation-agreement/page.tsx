import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Participation Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function ParticipationAgreementPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Participation Agreement' }]} />
      </div>
      <DocumentPage
        documentType="Participation Agreement"
        title="Participation Agreement"
        subtitle="Elevate for Humanity Career & Technical Institute"
        date="2025-01-01"
        version="1.0"
      >
        <DocumentSection heading="Purpose" number={1}>
          <p>
            This Participation Agreement outlines the expectations and requirements for active participation in Elevate for Humanity career pathway programs. By signing, the Student agrees to meet these standards for the duration of their enrollment.
          </p>
        </DocumentSection>

        <DocumentSection heading="Attendance Requirements" number={2}>
          <ul>
            <li>Maintain a minimum attendance rate of 80% of scheduled sessions</li>
            <li>Report absences to the program coordinator within 24 hours</li>
            <li>Three consecutive unexcused absences may result in program probation</li>
            <li>Tardiness of more than 15 minutes counts as a half-absence</li>
            <li>Excessive absences may result in dismissal from the program</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Academic Standards" number={3}>
          <ul>
            <li>Complete all assignments and assessments by their due dates</li>
            <li>Maintain satisfactory academic progress as defined by the program</li>
            <li>Participate actively in classroom, lab, and employer site day activities</li>
            <li>Seek help from instructors or the program coordinator when needed</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Professional Conduct" number={4}>
          <ul>
            <li>Treat all students, staff, instructors, and employer partners with respect</li>
            <li>Arrive on time and prepared for each session</li>
            <li>Follow all safety protocols, especially during hands-on training</li>
            <li>Dress appropriately per program dress code requirements</li>
            <li>No use of alcohol, drugs, or weapons on any training site</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Technology and LMS Usage" number={5}>
          <ul>
            <li>Complete all online coursework through the Elevate LMS platform</li>
            <li>Do not share login credentials with others</li>
            <li>Report any technical issues to the program coordinator promptly</li>
            <li>Do not use training devices for personal social media during class hours</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Employer Site Day Expectations" number={6}>
          <ul>
            <li>Follow all employer site rules and safety requirements</li>
            <li>Represent Elevate for Humanity professionally at all times</li>
            <li>Complete all required site documentation before leaving</li>
            <li>Report any incidents or concerns to the program coordinator immediately</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Consequences of Non-Compliance" number={7}>
          <p>Failure to meet participation requirements may result in:</p>
          <ul>
            <li>Written warning</li>
            <li>Program probation</li>
            <li>Suspension from employer site days</li>
            <li>Dismissal from the program</li>
          </ul>
          <p>Serious violations (violence, weapons, drug use) result in immediate dismissal without warning.</p>
        </DocumentSection>

        <DocumentSection heading="Grievance Procedure" number={8}>
          <p>
            Students who have a complaint should first speak with their program coordinator. If unresolved, submit a written grievance to the Program Director at <strong>info@elevateforhumanity.org</strong>. Elevate will respond within 10 business days.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={9}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="participation"
          agreementVersion="1.0"
          buttonLabel="Sign Participation Agreement"
          nextUrl="/student-portal/onboarding"
        />
      </DocumentPage>
    </>
  );
}
