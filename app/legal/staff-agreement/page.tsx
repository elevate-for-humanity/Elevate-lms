import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Staff Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function StaffAgreementPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Staff Agreement' }]} />
      </div>
      <DocumentPage
        documentType="Staff Agreement"
        title="Staff & Contractor Agreement"
        subtitle="Elevate for Humanity Career & Technical Institute"
        date="2025-01-01"
        version="1.0"
        confidential
      >
        <DocumentSection heading="Parties" number={1}>
          <p>
            This Staff Agreement is entered into between <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong> ("Elevate") and the staff member or contractor identified at the time of execution ("Staff Member").
          </p>
        </DocumentSection>

        <DocumentSection heading="Scope of Role" number={2}>
          <p>
            The Staff Member agrees to perform duties as assigned in their role description. Specific responsibilities, hours, and compensation are defined in the separate offer letter or contractor agreement. This Agreement governs conduct, confidentiality, and compliance obligations applicable to all staff and contractors.
          </p>
        </DocumentSection>

        <DocumentSection heading="Confidentiality" number={3}>
          <p>The Staff Member agrees to keep confidential all:</p>
          <ul>
            <li>Student educational records and personally identifiable information (FERPA-protected)</li>
            <li>Proprietary curriculum, training materials, and platform code</li>
            <li>Business strategies, financial information, and partner agreements</li>
            <li>Internal communications, system credentials, and API keys</li>
          </ul>
          <p>
            Confidentiality obligations survive termination of this Agreement for a period of three (3) years.
          </p>
        </DocumentSection>

        <DocumentSection heading="FERPA Compliance" number={4}>
          <p>
            All staff with access to student records must comply with FERPA. Student records may only be accessed for legitimate educational purposes. Unauthorized disclosure of student records is a federal violation and grounds for immediate termination.
          </p>
        </DocumentSection>

        <DocumentSection heading="Acceptable Use of Systems" number={5}>
          <ul>
            <li>Use Elevate systems only for authorized work purposes</li>
            <li>Do not share login credentials or access tokens with others</li>
            <li>Report any suspected security breach or unauthorized access immediately</li>
            <li>Do not install unauthorized software on Elevate devices or systems</li>
            <li>All work product created using Elevate systems is the property of Elevate</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Professional Conduct" number={6}>
          <ul>
            <li>Maintain professional boundaries with students at all times</li>
            <li>Do not engage in personal relationships with current students</li>
            <li>Report any student safety concerns, abuse, or misconduct immediately</li>
            <li>Represent Elevate for Humanity professionally in all public and partner interactions</li>
            <li>Comply with all applicable federal, state, and local laws in the performance of duties</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Intellectual Property" number={7}>
          <p>
            All curriculum, software, documentation, and other work product created by the Staff Member in the course of their duties is the sole property of Elevate for Humanity. The Staff Member assigns all rights, title, and interest in such work product to Elevate.
          </p>
        </DocumentSection>

        <DocumentSection heading="Non-Solicitation" number={8}>
          <p>
            During the term of this Agreement and for one (1) year following termination, the Staff Member agrees not to solicit Elevate students, staff, or partners for competing services.
          </p>
        </DocumentSection>

        <DocumentSection heading="Termination" number={9}>
          <p>
            Either party may terminate this Agreement with two (2) weeks written notice. Elevate may terminate immediately for cause, including but not limited to: FERPA violations, breach of confidentiality, student misconduct, or criminal conduct.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law" number={10}>
          <p>
            This Agreement is governed by the laws of the State of Indiana. Disputes shall be resolved in Marion County, Indiana.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={11}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="staff_agreement"
          agreementVersion="1.0"
          buttonLabel="Sign Staff Agreement"
          nextUrl="/admin/dashboard"
        />
      </DocumentPage>
    </>
  );
}
