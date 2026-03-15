import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'FERPA Consent | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function FerpaConsentPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'FERPA Consent' }]} />
      </div>
      <DocumentPage
        documentType="FERPA Consent Form"
        title="FERPA Consent"
        subtitle="Family Educational Rights and Privacy Act — 20 U.S.C. § 1232g"
        date="2025-01-01"
        version="1.0"
      >
        <DocumentSection heading="Purpose" number={1}>
          <p>
            The Family Educational Rights and Privacy Act (FERPA) protects the privacy of student education records. This consent authorizes Elevate for Humanity to disclose specific educational records to designated parties for the purposes described below.
          </p>
        </DocumentSection>

        <DocumentSection heading="Your Rights Under FERPA" number={2}>
          <p>As a student, you have the right to:</p>
          <ul>
            <li>Inspect and review your education records within 45 days of a request</li>
            <li>Request amendment of records you believe are inaccurate or misleading</li>
            <li>Consent to disclosure of personally identifiable information, except where FERPA authorizes disclosure without consent</li>
            <li>File a complaint with the U.S. Department of Education if you believe your rights have been violated</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Records That May Be Disclosed" number={3}>
          <ul>
            <li>Enrollment status and program of study</li>
            <li>Attendance records and participation hours</li>
            <li>Academic progress, assessment scores, and completion status</li>
            <li>Certificates and credentials earned</li>
            <li>Financial aid, funding source, and tuition assistance received</li>
            <li>Employment status at enrollment and upon program exit</li>
            <li>Demographic data required for federal PIRL reporting</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Authorized Recipients" number={4}>
          <p>By signing this consent, you authorize Elevate for Humanity to share the above records with:</p>
          <ul>
            <li><strong>Indiana Department of Workforce Development (DWD)</strong> — WIOA Title I compliance and outcome reporting</li>
            <li><strong>WorkOne / Local Workforce Development Boards</strong> — Case management and co-enrollment services</li>
            <li><strong>Indiana Department of Correction / JRI Program</strong> — Justice Reinvestment Initiative reporting</li>
            <li><strong>U.S. Department of Labor</strong> — Registered Apprenticeship RAPIDS reporting</li>
            <li><strong>Funding Agencies</strong> — Organizations providing tuition assistance, grants, or scholarships</li>
            <li><strong>Employer Partners</strong> — Limited to attendance and progress for apprenticeship and OJT placements</li>
            <li><strong>Accreditation and Compliance Bodies</strong> — As required for program approval and audit</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Duration" number={5}>
          <p>
            This consent remains in effect for the duration of your enrollment and for three (3) years following program completion, withdrawal, or exit, unless revoked in writing.
          </p>
        </DocumentSection>

        <DocumentSection heading="Revocation" number={6}>
          <p>
            You may revoke this consent at any time by submitting a written request to <strong>info@elevateforhumanity.org</strong>. Revocation is not retroactive and does not apply to records already disclosed. Revoking consent may affect eligibility for funded programs that require data sharing for compliance.
          </p>
        </DocumentSection>

        <DocumentSection heading="Directory Information" number={7}>
          <p>
            Elevate for Humanity may designate the following as directory information, which may be disclosed without consent: student name, program of study, enrollment status, dates of attendance, certificates earned, and honors received. You may opt out by notifying the Program Director in writing within 10 days of enrollment.
          </p>
        </DocumentSection>

        <DocumentSection heading="Contact" number={8}>
          <p>
            Elevate for Humanity — Program Director<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757<br />
            U.S. Department of Education: studentprivacy.ed.gov
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="ferpa"
          agreementVersion="1.0"
          buttonLabel="Sign FERPA Consent"
          nextUrl="/student-portal/onboarding"
        />
      </DocumentPage>
    </>
  );
}
