import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Memorandum of Understanding | Elevate for Humanity',
  description:
    'Memorandum of Understanding for Elevate for Humanity partnerships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal/mou',
  },
};

export default function MOUPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'MOU' }]} />
      </div>

      <DocumentPage
        documentType="Memorandum of Understanding"
        title="Partnership Agreement"
        subtitle="Elevate for Humanity — Registered Apprenticeship and Workforce Development"
        date="2024-12-15"
        version="1.0"
        confidential
      >
        <DocumentSection heading="Purpose" number={1}>
          <p>
            This Memorandum of Understanding establishes a collaborative partnership
            between Elevate for Humanity and the partnering organization to provide
            apprenticeship training and workforce development services.
          </p>
        </DocumentSection>

        <DocumentSection heading="Parties" number={2}>
          <div className="bg-white p-4 rounded-lg mb-3">
            <p>
              <strong>Elevate for Humanity</strong><br />
              Registered Apprenticeship Sponsor<br />
              Indiana RAPIDS Program
            </p>
          </div>
          <p>And the partnering organization as identified in the executed agreement.</p>
        </DocumentSection>

        <DocumentSection heading="Scope of Partnership" number={3}>
          <p>The parties agree to collaborate on:</p>
          <ul>
            <li>Registered apprenticeship training programs</li>
            <li>Student recruitment and enrollment</li>
            <li>Training site coordination and oversight</li>
            <li>Compliance with state and federal regulations</li>
            <li>Quality assurance and program evaluation</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="EFH Responsibilities" number={4}>
          <p>Elevate for Humanity agrees to:</p>
          <ul>
            <li>Serve as the registered apprenticeship sponsor</li>
            <li>Provide curriculum and training materials</li>
            <li>Maintain RAPIDS registration and compliance</li>
            <li>Process student enrollments and track progress</li>
            <li>Provide technical support and platform access</li>
          </ul>
          <ul>
            <li>Coordinate with funding sources (WIOA, WRG, etc.)</li>
            <li>Issue certificates upon program completion</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Partner Responsibilities" number={5}>
          <p>The Partner agrees to:</p>
          <ul>
            <li>Provide qualified training sites and supervisors</li>
            <li>Ensure compliance with safety and licensing requirements</li>
            <li>Submit required documentation and reports</li>
            <li>Maintain appropriate insurance coverage</li>
            <li>Cooperate with program monitoring and evaluation</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Student Services" number={6}>
          <p>Both parties commit to providing students with:</p>
          <ul>
            <li>Quality training and mentorship</li>
            <li>Safe and professional learning environments</li>
            <li>Clear expectations and progress tracking</li>
            <li>Support services and resources</li>
            <li>Preparation for state licensing examinations</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Compliance" number={7}>
          <p>Both parties agree to comply with:</p>
          <ul>
            <li>Indiana Professional Licensing Agency regulations</li>
            <li>U.S. Department of Labor apprenticeship standards</li>
            <li>WIOA and workforce development requirements</li>
            <li>Equal opportunity and non-discrimination laws</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={8}>
          <p>
            This MOU shall remain in effect for one (1) year from the date of execution and may be
            renewed by mutual agreement. Either party may terminate this MOU with thirty (30) days
            written notice.
          </p>
        </DocumentSection>

        <DocumentSection heading="Amendments" number={9}>
          <p>
            This MOU may be amended only by written agreement signed by authorized representatives
            of both parties.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact Information" number={10}>
          <p>For questions regarding this Memorandum of Understanding:</p>
          <div className="bg-white p-4 rounded-lg">
            <p>
              <strong>Elevate for Humanity</strong><br />
              Email: info@elevateforhumanity.org<br />
              Phone: (317) 314-3757<br />
              www.elevateforhumanity.org
            </p>
          </div>
        </DocumentSection>
      </DocumentPage>
    </>
  );
}
