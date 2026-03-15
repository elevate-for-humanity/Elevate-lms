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
        version="1.0"
      >
        <DocumentSection heading="Mission" number={1}>
          <p>
            Elevate for Humanity provides accessible, high-quality career training and credentialing to individuals seeking economic mobility. We serve job seekers, returning citizens, veterans, and underserved communities across Indiana.
          </p>
        </DocumentSection>

        <DocumentSection heading="Code of Conduct" number={2}>
          <ul>
            <li>Treat all students, staff, instructors, and employer partners with dignity and respect</li>
            <li>Arrive on time and prepared for every session</li>
            <li>No harassment, discrimination, or bullying of any kind</li>
            <li>No use of alcohol, drugs, or weapons on any training site or employer site day</li>
            <li>No recording of instructors, staff, or fellow students without consent</li>
            <li>Dress appropriately per program dress code requirements</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Attendance Policy" number={3}>
          <ul>
            <li>Minimum 80% attendance required to remain in good standing</li>
            <li>Report absences to your program coordinator within 24 hours</li>
            <li>Three consecutive unexcused absences may result in probation</li>
            <li>Tardiness of more than 15 minutes counts as a half-absence</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Academic Integrity" number={4}>
          <ul>
            <li>All submitted work must be your own</li>
            <li>Plagiarism or cheating on exams will result in immediate dismissal</li>
            <li>Do not share LMS login credentials with others</li>
            <li>AI-generated content submitted as original work is prohibited</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Technology and LMS" number={5}>
          <ul>
            <li>Access your coursework through the Elevate LMS at elevateforhumanity.org</li>
            <li>Report technical issues to your program coordinator promptly</li>
            <li>Do not use training devices for personal social media during class hours</li>
            <li>Elevate is not responsible for personal devices brought to training sites</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Employer Site Days" number={6}>
          <p>
            Some programs include employer site days where students visit partner workplaces. During these visits:
          </p>
          <ul>
            <li>Follow all employer site rules and safety requirements</li>
            <li>Represent Elevate for Humanity professionally at all times</li>
            <li>Complete all required site documentation before leaving</li>
            <li>Report any incidents or concerns to your program coordinator immediately</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Safety" number={7}>
          <ul>
            <li>Follow all safety protocols during hands-on training, especially in trades programs</li>
            <li>Wear required personal protective equipment (PPE) at all times when instructed</li>
            <li>Report any unsafe conditions to your instructor immediately</li>
            <li>Emergency exits and procedures are reviewed at program orientation</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Student Rights" number={8}>
          <ul>
            <li>Right to a safe, respectful learning environment</li>
            <li>Right to inspect your educational records under FERPA</li>
            <li>Right to file a grievance without retaliation</li>
            <li>Right to reasonable accommodations for documented disabilities</li>
            <li>Right to withdraw from the program at any time (see refund policy)</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Grievance Procedure" number={9}>
          <p>
            If you have a complaint, first speak with your program coordinator. If unresolved within 5 business days, submit a written grievance to the Program Director at <strong>info@elevateforhumanity.org</strong>. Elevate will respond within 10 business days. Students may also contact the Indiana Commission for Higher Education or the U.S. Department of Education if the matter is not resolved internally.
          </p>
        </DocumentSection>

        <DocumentSection heading="Disciplinary Process" number={10}>
          <p>Violations of this handbook may result in:</p>
          <ul>
            <li>Verbal or written warning</li>
            <li>Program probation</li>
            <li>Suspension from employer site days</li>
            <li>Dismissal from the program</li>
          </ul>
          <p>Serious violations (violence, weapons, drug use) result in immediate dismissal without warning.</p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={11}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="handbook"
          agreementVersion="1.0"
          buttonLabel="Acknowledge Student Handbook"
          nextUrl="/student-portal/onboarding"
        />
      </DocumentPage>
    </>
  );
}
