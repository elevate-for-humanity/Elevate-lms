import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Data Sharing Consent | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function DataSharingPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Data Sharing Consent' }]} />
      </div>
      <DocumentPage
        documentType="Data Sharing Consent"
        title="Data Sharing Consent Form"
        subtitle="Elevate for Humanity Career & Technical Institute"
        date="2025-01-01"
        version="1.0"
      >
        <DocumentSection heading="Purpose" number={1}>
          <p>
            This consent authorizes Elevate for Humanity to share your personal and educational data with designated agencies and partners as required for program funding, compliance reporting, and workforce development services under WIOA, JRI, the Workforce Ready Grant, and DOL Registered Apprenticeship programs.
          </p>
        </DocumentSection>

        <DocumentSection heading="Data That May Be Shared" number={2}>
          <ul>
            <li>Name, date of birth, Social Security Number (last 4 digits for reporting)</li>
            <li>Contact information (address, phone, email)</li>
            <li>Enrollment status, program of study, and start/end dates</li>
            <li>Attendance records and academic progress</li>
            <li>Employment status at enrollment and upon program exit</li>
            <li>Credential and certification attainment</li>
            <li>Funding source and financial assistance received</li>
            <li>Demographic information required for federal reporting (PIRL)</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Authorized Recipients" number={3}>
          <ul>
            <li><strong>Indiana Department of Workforce Development (DWD)</strong> — WIOA Title I compliance and outcome reporting</li>
            <li><strong>WorkOne / Local Workforce Development Boards</strong> — Case management and co-enrollment services</li>
            <li><strong>Indiana Department of Correction / JRI Program</strong> — Justice Reinvestment Initiative reporting</li>
            <li><strong>U.S. Department of Labor</strong> — Registered Apprenticeship RAPIDS reporting</li>
            <li><strong>Employer Partners</strong> — Limited to attendance and progress for apprenticeship and OJT placements</li>
            <li><strong>Funding Agencies</strong> — Organizations providing tuition assistance, grants, or scholarships</li>
            <li><strong>Accreditation and Compliance Bodies</strong> — As required for program approval and audit</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="How Data Is Protected" number={4}>
          <ul>
            <li>All data is transmitted via encrypted connections (TLS 1.2+)</li>
            <li>Access is limited to authorized personnel with a need-to-know</li>
            <li>Data is stored in Supabase with row-level security and audit logging</li>
            <li>Elevate does not sell your data to third parties</li>
            <li>Data retention follows FERPA and applicable federal program requirements</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Duration" number={5}>
          <p>
            This consent is effective from the date of signing and remains in effect for the duration of your enrollment and for three (3) years following program completion, withdrawal, or exit, as required by federal reporting obligations.
          </p>
        </DocumentSection>

        <DocumentSection heading="Right to Revoke" number={6}>
          <p>
            You may revoke this consent at any time by submitting a written request to <strong>info@elevateforhumanity.org</strong>. Revocation is not retroactive. Revoking consent may affect your eligibility for funded programs that require data sharing for compliance.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={7}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="data_sharing"
          agreementVersion="1.0"
          buttonLabel="Sign Data Sharing Consent"
          nextUrl="/student-portal/onboarding"
        />
      </DocumentPage>
    </>
  );
}
