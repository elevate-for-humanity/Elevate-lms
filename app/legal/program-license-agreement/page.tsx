import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Program Licensing Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function ProgramLicenseAgreementPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Legal', href: '/legal' },
          { label: 'Program Licensing Agreement' },
        ]} />
      </div>
      <DocumentPage
        documentType="Program Licensing Agreement"
        title="Inter-Entity Program Licensing Agreement"
        subtitle="Elevate for Humanity (Nonprofit) and 2Exclusive LLC-S (Operating Company)"
        date="2025-01-01"
        version="1.0"
        confidential
      >

        <DocumentSection heading="Parties" number={1}>
          <p>
            This Program Licensing Agreement ("Agreement") is entered into between:
          </p>
          <ul>
            <li>
              <strong>Elevate for Humanity</strong> ("Program Authority"), a nonprofit organization
              operating under Indiana law, responsible for curriculum, credential relationships,
              compliance, and program standards; and
            </li>
            <li>
              <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong>{' '}
              ("Operating Company"), a for-profit limited liability company operating under Indiana law,
              responsible for enrollment operations, tuition collection, technology infrastructure,
              marketing, and training network expansion.
            </li>
          </ul>
          <p className="mt-3">
            Together, the parties operate a coordinated hybrid training model in which the Program
            Authority defines and owns the program, and the Operating Company delivers and scales it.
          </p>
        </DocumentSection>

        <DocumentSection heading="Purpose" number={2}>
          <p>
            The Program Authority authorizes the Operating Company to deliver workforce training
            programs under the Program Authority's standards, brand, and credential framework.
            This Agreement defines the scope of that authorization, the responsibilities of each
            entity, and the financial arrangement between them.
          </p>
          <p className="mt-3">
            This Agreement does not merge the two entities, create shared ownership, or transfer
            any intellectual property from the Program Authority to the Operating Company. The
            Program Authority retains all ownership rights defined in Section 4.
          </p>
        </DocumentSection>

        <DocumentSection heading="Program Authority Responsibilities" number={3}>
          <p>The Program Authority is solely responsible for:</p>
          <ul>
            <li>Curriculum design, instructional standards, and all program content</li>
            <li>Credential alignment and relationships with credentialing bodies (EPA, CompTIA, Indiana SDOH, ICAADA, and others)</li>
            <li>ETPL registration and compliance with Indiana Department of Workforce Development requirements</li>
            <li>Student outcome reporting to state and federal workforce agencies</li>
            <li>Compliance with WIOA nondiscrimination requirements and federal workforce program regulations</li>
            <li>Program quality standards and instructor qualification requirements</li>
            <li>Approval of any modifications to curriculum or credential structure</li>
            <li>Professional liability insurance covering curriculum and instruction</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Program Authority Ownership" number={4}>
          <p>
            The Program Authority retains sole and exclusive ownership of:
          </p>
          <ul>
            <li>All curriculum materials, instructional content, assessments, and media</li>
            <li>Program model, training methodology, and operational framework</li>
            <li>Credential relationships and exam authorization agreements</li>
            <li>ETPL registration and workforce agency relationships</li>
            <li>Elevate for Humanity brand, trademarks, and public identity</li>
            <li>Student outcome data and program performance records</li>
          </ul>
          <p className="mt-3">
            The Operating Company receives a limited, non-exclusive, non-transferable license to
            use these assets solely for the purpose of delivering authorized training programs
            under this Agreement. This license terminates automatically upon expiration or
            termination of this Agreement.
          </p>
        </DocumentSection>

        <DocumentSection heading="Operating Company Responsibilities" number={5}>
          <p>The Operating Company is responsible for:</p>
          <ul>
            <li>Student enrollment, admissions processing, and enrollment agreements</li>
            <li>Tuition collection, payment processing, and financial recordkeeping</li>
            <li>Learning Management System (LMS) operation and technology infrastructure</li>
            <li>Marketing, recruitment, and student outreach</li>
            <li>Contracts with Training Network host facilities and coordination partners</li>
            <li>Instructor hiring, payroll, and operational HR</li>
            <li>Training network expansion — identifying, approving, and onboarding new delivery sites</li>
            <li>Operational compliance with state business registration requirements in each state of operation</li>
            <li>General commercial liability insurance for program operations</li>
          </ul>
          <p className="mt-3">
            The Operating Company may not modify curriculum, alter credential requirements, or
            represent programs to workforce agencies without written authorization from the
            Program Authority.
          </p>
        </DocumentSection>

        <DocumentSection heading="Revenue Flow and Program Support Fee" number={6}>
          <p>
            All tuition payments are collected by the Operating Company. Operational costs are
            paid from gross tuition at the Operating Company level. Net program revenue is
            calculated as gross tuition minus operational costs as defined in the Training
            Network Partner Agreement.
          </p>
          <p className="mt-3">
            The Operating Company pays the Program Authority a <strong>Program Support Fee</strong>{' '}
            equal to <strong>ten percent (10%) of gross tuition collected</strong> per cohort.
            This fee sustains the Program Authority's curriculum development, compliance, and
            credential maintenance functions. The Program Support Fee is paid within 30 days
            of cohort completion.
          </p>
          <p className="mt-3">
            The Program Support Fee is not contingent on net revenue and is paid before host
            compensation is calculated. This ensures the Program Authority's operational
            sustainability is not affected by host compensation arrangements.
          </p>
        </DocumentSection>

        <DocumentSection heading="Multi-State Expansion" number={7}>
          <p>
            The Operating Company may expand the training network into additional states by
            registering as a foreign entity in each state of operation. Expansion does not
            require approval from existing Training Network host sites.
          </p>
          <p className="mt-3">
            Before operating in a new state, the Operating Company must:
          </p>
          <ul>
            <li>Complete required foreign entity registration in that state</li>
            <li>Notify the Program Authority of the expansion in writing</li>
            <li>Confirm that the program curriculum and credential structure are appropriate for that state's workforce requirements</li>
            <li>Ensure any state-specific workforce program compliance requirements are met</li>
          </ul>
          <p className="mt-3">
            The Program Authority retains the right to withhold authorization for expansion into
            a specific state if compliance requirements cannot be met or if the expansion would
            jeopardize ETPL status or credential relationships.
          </p>
        </DocumentSection>

        <DocumentSection heading="Insurance and Liability Separation" number={8}>
          <p>
            Insurance responsibilities are separated to prevent a facility-level incident from
            exposing the entire training network:
          </p>
          <ul>
            <li>
              <strong>Program Authority:</strong> Professional liability insurance covering
              curriculum, instruction, and program standards.
            </li>
            <li>
              <strong>Operating Company:</strong> General commercial liability insurance covering
              program operations, enrollment, and technology infrastructure.
            </li>
            <li>
              <strong>Host Facilities (Tier 1):</strong> General liability and facility insurance
              covering the physical training location and on-site supervision, as required by the
              Training Network Partner Agreement.
            </li>
          </ul>
          <p className="mt-3">
            Neither entity is liable for the other's operational failures, provided each maintains
            its required coverage and operates within its defined scope.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governance and Decision Authority" number={9}>
          <p>
            The Program Authority retains decision rights over:
          </p>
          <ul>
            <li>Curriculum content and instructional standards</li>
            <li>Credential alignment and exam authorization</li>
            <li>Program integrity and quality standards</li>
            <li>ETPL compliance and workforce agency reporting</li>
          </ul>
          <p className="mt-3">
            The Operating Company retains decision rights over:
          </p>
          <ul>
            <li>Enrollment operations and tuition pricing (within parameters set by the Program Authority)</li>
            <li>Marketing and recruitment strategy</li>
            <li>Technology infrastructure and LMS operations</li>
            <li>Host facility selection and Training Network expansion</li>
            <li>Instructor hiring and operational staffing</li>
          </ul>
          <p className="mt-3">
            Tuition pricing changes that affect ETPL-reported program costs require notification
            to the Program Authority at least 30 days before implementation.
          </p>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={10}>
          <p>
            This Agreement is effective for three (3) years from execution and renews automatically
            for successive three-year terms unless either party provides 90 days written notice of
            non-renewal.
          </p>
          <p className="mt-3">
            The Program Authority may terminate this Agreement immediately if the Operating Company:
          </p>
          <ul>
            <li>Modifies curriculum or credential requirements without authorization</li>
            <li>Misrepresents the program to workforce agencies or credentialing bodies</li>
            <li>Fails to remit the Program Support Fee within 60 days of the due date</li>
            <li>Takes actions that jeopardize ETPL status or credential relationships</li>
          </ul>
          <p className="mt-3">
            Upon termination, the Operating Company's license to use Program Authority assets
            terminates immediately. Active cohorts continue under this Agreement until completion.
            The Operating Company must return or destroy all proprietary curriculum materials
            within 30 days of termination.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law" number={11}>
          <p>
            This Agreement is governed by the laws of the State of Indiana. Disputes shall first
            be submitted to good-faith mediation. If unresolved within 30 days, the parties
            consent to jurisdiction in Marion County, Indiana.
          </p>
        </DocumentSection>

      </DocumentPage>
    </>
  );
}
