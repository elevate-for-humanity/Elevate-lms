import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Employer Partnership Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function EmployerAgreementPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Employer Agreement' }]} />
      </div>
      <DocumentPage
        documentType="Employer Partnership Agreement"
        title="Employer Partnership Agreement"
        subtitle="Elevate for Humanity — Workforce & Apprenticeship Programs"
        date="2025-01-01"
        version="1.0"
        confidential
      >
        <DocumentSection heading="Parties" number={1}>
          <p>
            This Employer Partnership Agreement is entered into between <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong> ("Elevate") and the employer identified at the time of execution ("Employer").
          </p>
        </DocumentSection>

        <DocumentSection heading="Purpose" number={2}>
          <p>
            This Agreement establishes the terms under which the Employer will participate in Elevate workforce programs, including employer site days, on-the-job training (OJT), and DOL Registered Apprenticeship programs.
          </p>
        </DocumentSection>

        <DocumentSection heading="Employer Responsibilities" number={3}>
          <ul>
            <li>Provide a safe, professional, and non-discriminatory work environment for all participants</li>
            <li>Designate a qualified supervisor or journey-level worker for each apprentice or OJT participant</li>
            <li>Submit OJT hours and progress reports to Elevate on the schedule agreed at onboarding</li>
            <li>Comply with all applicable federal and state labor laws, including FLSA and OSHA requirements</li>
            <li>Maintain workers' compensation and general liability insurance at required levels</li>
            <li>Notify Elevate within 48 hours of any incident, injury, or participant termination</li>
            <li>Not discriminate against participants on the basis of race, color, religion, sex, national origin, disability, age, or veteran status</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Elevate Responsibilities" number={4}>
          <ul>
            <li>Recruit, screen, and prepare participants prior to employer placement</li>
            <li>Provide curriculum, training materials, and LMS access for related technical instruction</li>
            <li>Maintain RAPIDS registration and DOL apprenticeship compliance</li>
            <li>Coordinate funding reimbursements (OJT wage reimbursement, WRG, WIOA) where applicable</li>
            <li>Serve as the primary point of contact for participant issues and compliance questions</li>
            <li>Conduct site visits and quality assurance reviews as required</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Apprenticeship Standards" number={5}>
          <p>
            For DOL Registered Apprenticeship placements, the Employer agrees to comply with the applicable apprenticeship standards on file with the U.S. Department of Labor (RAPIDS Program ID: 2025-IN-132301) and the Indiana Department of Workforce Development.
          </p>
        </DocumentSection>

        <DocumentSection heading="Wage Requirements" number={6}>
          <p>
            Apprentices and OJT participants must be paid at least the applicable minimum wage. Apprentice wage schedules follow the DOL progressive wage scale as defined in the apprenticeship standards. Employers participating in OJT wage reimbursement programs must maintain payroll records for audit purposes.
          </p>
        </DocumentSection>

        <DocumentSection heading="Data and Confidentiality" number={7}>
          <p>
            The Employer may receive limited participant data (name, attendance, progress) for supervision purposes only. This data may not be shared with third parties or used for any purpose other than program supervision. All participant data is protected under FERPA.
          </p>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={8}>
          <p>
            This Agreement is effective for one (1) year from execution and renews automatically. Either party may terminate with 30 days written notice. Elevate may terminate immediately if the Employer creates an unsafe environment, violates labor laws, or breaches participant confidentiality.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law" number={9}>
          <p>
            This Agreement is governed by the laws of the State of Indiana. Disputes shall be resolved in Marion County, Indiana.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={10}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="employer_agreement"
          agreementVersion="1.0"
          buttonLabel="Sign Employer Agreement"
          nextUrl="/onboarding/employer"
        />
      </DocumentPage>
    </>
  );
}
