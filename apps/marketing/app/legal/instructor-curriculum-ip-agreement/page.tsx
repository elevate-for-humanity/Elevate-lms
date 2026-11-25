import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getInstructorLicenseRenewalTarget, INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION } from '@/lib/legal/instructorCurriculumLicense';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Proprietary Curriculum and Authorized Instructor License',
  robots: { index: false, follow: false },
};

export default async function InstructorCurriculumIpAgreementPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const renewalLicenseId = user ? await getInstructorLicenseRenewalTarget(
    await requireAdminClient(), user.id, INSTRUCTOR_CURRICULUM_IP_CURRENT_VERSION) : null;
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Legal', href: '/legal' },
            { label: 'Instructor License Agreement' },
          ]}
        />
      </div>
      <DocumentPage
        documentType="Proprietary Curriculum and Authorized Instructor License"
        title="Proprietary Curriculum and Authorized Instructor License Agreement"
        subtitle={`${PLATFORM_DEFAULTS.orgName} Career & Technical Institute — Elevate HVAC/R Virtual Training Academy`}
        date="2026-11-25"
        version="1.0"
      >
        <DocumentSection heading="Status" number={0}>
          <p>
            <strong>
              Draft version 1.0 — pending legal review and owner approval of this text.
            </strong>{' '}
            Signing this version records acceptance of the draft terms and activates the
            instructor license for the current version. A newer published version requires
            signing again. The general instructor services agreement does not satisfy this
            license.
          </p>
        </DocumentSection>

        <DocumentSection heading="Intellectual property ownership" number={1}>
          <p>
            All proprietary curriculum, instructional materials, simulations, software,
            assessments, workbooks, graphics, videos and instructor resources remain the
            property of Elevate for Humanity or its designated legal rights holder, to the
            extent legally protectable.
          </p>
        </DocumentSection>

        <DocumentSection heading="Limited teaching authorization" number={2}>
          <p>
            The instructor receives a limited, nonexclusive, nontransferable and revocable
            authorization to use the curriculum solely for approved Elevate training
            activities.
          </p>
        </DocumentSection>

        <DocumentSection heading="Prohibited activities" number={3}>
          <p>Without prior written authorization, the instructor shall not:</p>
          <ul>
            <li>Copy, reproduce, download or redistribute proprietary materials.</li>
            <li>Sell, sublicense or commercially exploit the curriculum.</li>
            <li>Register or claim ownership or copyright over Elevate materials.</li>
            <li>Create unauthorized derivative courses using protected materials.</li>
            <li>Record or distribute protected instructional content.</li>
            <li>Share login credentials or provide unauthorized access.</li>
            <li>Upload confidential course materials to external platforms or AI systems.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Confidentiality" number={4}>
          <p>
            The instructor agrees to protect nonpublic course content, assessment materials,
            software, business information and student records.
          </p>
          <p>
            This agreement does not prohibit legally protected disclosures or the use of
            independently acquired professional knowledge.
          </p>
        </DocumentSection>

        <DocumentSection heading="Curriculum contributions" number={5}>
          <p>
            Ownership and assignment of newly commissioned instructional contributions shall be
            documented through applicable written intellectual property assignment provisions.
          </p>
        </DocumentSection>

        <DocumentSection heading="Termination" number={6}>
          <p>
            Elevate may revoke instructional authorization for violations of this agreement or
            upon termination of the instructor relationship, subject to applicable law and
            contractual obligations.
          </p>
        </DocumentSection>

        <DocumentSection heading="Electronic acknowledgment" number={7}>
          <p>
            By signing, the instructor acknowledges these restrictions and understands that
            course access does not transfer intellectual property ownership.
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          renewalLicenseId={renewalLicenseId}
          agreementType="instructor_curriculum_ip"
          agreementVersion="1.0"
          buttonLabel="Sign Instructor License Agreement"
          nextUrl="/onboarding/instructor"
        />
      </DocumentPage>
    </>
  );
}
