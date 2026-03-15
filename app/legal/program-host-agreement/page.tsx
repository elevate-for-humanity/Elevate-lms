import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Master Program Host Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function ProgramHostAgreementPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Legal', href: '/legal' },
          { label: 'Master Program Host Agreement' },
        ]} />
      </div>
      <DocumentPage
        documentType="Master Program Host Agreement"
        title="Master Program Host Agreement"
        subtitle="Elevate for Humanity Training Network — Authorized Delivery Site Agreement"
        date="2025-01-01"
        version="1.0"
        confidential
      >

        <DocumentSection heading="Parties and Purpose" number={1}>
          <p>
            This Master Program Host Agreement ("Agreement") is entered into between{' '}
            <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong>{' '}
            ("Operating Company"), the training network operating entity, and the organization
            identified at execution ("Host Facility").
          </p>
          <p className="mt-3">
            The Operating Company delivers workforce training programs under the program authority
            and curriculum standards of <strong>Elevate for Humanity</strong> ("Program Authority"),
            the nonprofit program owner. The Host Facility is authorized to serve as an approved
            delivery site within the Elevate for Humanity Training Network solely under the terms
            of this Agreement.
          </p>
          <p className="mt-3">
            This Agreement is the complete and standardized agreement governing all host facility
            relationships within the Training Network. Terms are not negotiable on a per-site basis.
            Every authorized delivery site operates under this same Agreement.
          </p>
        </DocumentSection>

        <DocumentSection heading="What This Agreement Is Not" number={2}>
          <p>
            This Agreement does not create a partnership, joint venture, franchise, co-ownership
            arrangement, employment relationship, or shared governance structure between the
            Operating Company and the Host Facility.
          </p>
          <p className="mt-3">
            A <strong>partnership</strong> is a business relationship in which two or more parties
            jointly own and operate a business, share governance authority, and share profits,
            losses, and decision-making control. That is not this relationship.
          </p>
          <p className="mt-3">
            The Host Facility is an independent organization that provides a physical training
            location and on-site operational support. It does not obtain ownership rights,
            governance authority, or decision-making authority over the training program, its
            curriculum, its credentials, its tuition structure, or its brand.
          </p>
          <p className="mt-3">
            The Host Facility may not represent itself as a co-owner, partner, co-founder, or
            governing authority of Elevate for Humanity or the Operating Company in any public
            communication, grant application, funding proposal, or legal document.
          </p>
        </DocumentSection>

        <DocumentSection heading="Program Authority — What Elevate Controls" number={3}>
          <p>
            The following remain under the sole and exclusive authority of the Program Authority
            and Operating Company, regardless of the Host Facility's tier or duration of
            participation:
          </p>
          <ul>
            <li>Curriculum design, instructional content, and all program materials</li>
            <li>Learning Management System (LMS) and all digital instruction platforms</li>
            <li>Credential alignment, exam preparation, and testing relationships</li>
            <li>Tuition rates, financial policies, and student payment structures</li>
            <li>Student enrollment, admissions criteria, and program eligibility</li>
            <li>Instructor standards, qualifications, and quality control</li>
            <li>Elevate for Humanity brand, trademarks, and public identity</li>
            <li>Compliance reporting to workforce agencies and credential bodies</li>
            <li>Student outcome data and program performance records</li>
            <li>Approval, suspension, or termination of host site authorization</li>
            <li>Expansion of the Training Network into additional states or regions</li>
          </ul>
          <p className="mt-3">
            The Host Facility may not modify curriculum, alter tuition, issue credentials,
            apply for workforce funding on behalf of Elevate programs, or enter into agreements
            on behalf of the Operating Company or Program Authority.
          </p>
        </DocumentSection>

        <DocumentSection heading="Host Facility Authorization Tiers" number={4}>
          <p>
            The Host Facility is authorized under one of the following tiers, as designated in
            Schedule A. The Operating Company reserves the right to reclassify a Host Facility's
            tier upon 30 days written notice if the facility's actual contributions change.
          </p>

          <h4 className="font-bold text-slate-800 mt-6 mb-1">Tier 1 — Full Facility Host</h4>
          <p className="text-sm text-slate-600 mb-3">
            Provides a dedicated physical training facility and full on-site operational support
            for the complete cohort duration.
          </p>

          <p className="font-semibold text-sm">Facility Standards (required before first cohort):</p>
          <ul>
            <li>Dedicated classroom or training space for the enrolled cohort — not shared with unrelated activities during training hours</li>
            <li>Seating and workstations sufficient for all enrolled students</li>
            <li>Reliable broadband internet (minimum 25 Mbps download per concurrent user)</li>
            <li>Physical environment compliant with local building codes and fire safety requirements</li>
            <li>ADA-accessible facility with accessible restrooms and entry</li>
            <li>Adequate lighting, ventilation, and temperature control for extended training sessions</li>
          </ul>

          <p className="font-semibold text-sm mt-4">Operational Duties:</p>
          <ul>
            <li>Facility available for all scheduled training hours for the full cohort duration — cancellations require 14 days notice except in emergencies</li>
            <li>Designated on-site coordinator assigned for each cohort, available during all training hours</li>
            <li>Attendance monitoring and daily attendance records submitted to the Operating Company within 24 hours of each session</li>
            <li>Student supervision during all in-person training hours</li>
            <li>Immediate notification to the Operating Company of any safety incident, student concern, or facility issue</li>
            <li>Coordination with Operating Company program staff throughout the cohort</li>
          </ul>

          <p className="font-semibold text-sm mt-4">Insurance Requirements:</p>
          <ul>
            <li>Commercial general liability insurance: minimum $1,000,000 per occurrence / $2,000,000 aggregate</li>
            <li>Facility/property insurance covering the training space and its contents</li>
            <li>Workers' compensation insurance if any Host Facility staff are present during training</li>
            <li>Operating Company named as additional insured on the general liability policy</li>
            <li>Proof of insurance provided to Operating Company before first cohort and upon each annual renewal</li>
          </ul>

          <p className="font-semibold text-sm mt-4">Compensation:</p>
          <p className="text-sm">
            One-third (1/3) of net program revenue per cohort delivered at the facility.
            Net revenue = gross tuition collected minus operational costs defined in Section 6.
            Payment within 30 days of cohort completion and written reconciliation.
          </p>

          <h4 className="font-bold text-slate-800 mt-8 mb-1">Tier 2 — Coordination Host</h4>
          <p className="text-sm text-slate-600 mb-3">
            Provides student coordination and supervision support. Does not provide a training
            facility. Training occurs at an Operating Company-provided or approved location.
          </p>

          <p className="font-semibold text-sm">Operational Duties:</p>
          <ul>
            <li>Student coordination and communication throughout the program</li>
            <li>Attendance tracking and records submitted to Operating Company within 24 hours of each session</li>
            <li>Supervision support during hybrid or in-person sessions</li>
            <li>Liaison between enrolled students and Operating Company program staff</li>
          </ul>

          <p className="font-semibold text-sm mt-4">Compensation:</p>
          <p className="text-sm">
            Fifteen percent (15%) of net program revenue per cohort supported.
            Payment within 30 days of cohort completion and written reconciliation.
          </p>

          <h4 className="font-bold text-slate-800 mt-8 mb-1">Tier 3 — Referral Partner</h4>
          <p className="text-sm text-slate-600 mb-3">
            Refers eligible individuals to Elevate programs. No operational responsibility
            for program delivery.
          </p>

          <p className="font-semibold text-sm">Duties:</p>
          <ul>
            <li>Referral of eligible individuals to Elevate enrollment</li>
            <li>Community outreach and awareness activities</li>
            <li>Accurate representation of Elevate programs — no misrepresentation of credentials, outcomes, or funding eligibility</li>
          </ul>

          <p className="font-semibold text-sm mt-4">Compensation:</p>
          <p className="text-sm">
            Flat referral fee of <strong>$250–$500 per enrolled student</strong> as specified
            in Schedule A. Paid upon confirmed enrollment and initial tuition payment.
            No revenue share.
          </p>
        </DocumentSection>

        <DocumentSection heading="Student Enrollment and Ownership" number={5}>
          <p>
            All students enrolled in Elevate programs are participants of the Elevate for Humanity
            Training Network regardless of which facility delivers in-person components. Student
            records, enrollment data, credential progress, and outcome data are maintained
            exclusively by the Operating Company and Program Authority.
          </p>
          <p className="mt-3">
            The Host Facility does not obtain ownership rights over student enrollment, tuition
            structures, credential access, or post-program placement services. Student data
            shared with the Host Facility is governed by FERPA and requires written student
            consent limited to the Host Facility's operational role.
          </p>
          <p className="mt-3">
            The Host Facility may not contact enrolled students for purposes outside its
            designated tier responsibilities without written authorization from the Operating
            Company.
          </p>
        </DocumentSection>

        <DocumentSection heading="Operational Costs and Net Revenue" number={6}>
          <p>
            Host compensation under Tier 1 and Tier 2 is calculated on{' '}
            <strong>net program revenue</strong> — gross tuition collected minus:
          </p>
          <ul>
            <li>Credential exam fees and testing administration</li>
            <li>LMS licensing and technology infrastructure</li>
            <li>Curriculum development and maintenance</li>
            <li>Marketing, recruitment, and student outreach</li>
            <li>Compliance, reporting, and workforce agency administration</li>
            <li>Program administration and management</li>
            <li>Payment processing fees</li>
            <li>Insurance and legal compliance</li>
            <li>Student services and support</li>
            <li>Program Support Fee paid to the Program Authority (nonprofit)</li>
          </ul>
          <p className="mt-3">
            The Operating Company provides a written cost reconciliation within 15 days of
            cohort completion. The Host Facility may request supporting documentation within
            10 days of receipt.
          </p>
        </DocumentSection>

        <DocumentSection heading="Intellectual Property and Non-Replication" number={7}>
          <p>
            All curriculum materials, instructional content, LMS systems, operational procedures,
            branding, credential alignments, and program methodologies are proprietary intellectual
            property owned exclusively by the Program Authority (Elevate for Humanity nonprofit).
          </p>
          <p className="mt-3">
            The Host Facility receives limited, non-transferable authorization to support delivery
            of program components solely for approved cohorts under this Agreement. This
            authorization terminates automatically upon expiration or termination of this Agreement.
          </p>
          <p className="mt-3">
            During the term of this Agreement and for <strong>three (3) years following
            termination</strong>, the Host Facility agrees not to:
          </p>
          <ul>
            <li>Replicate, reproduce, or develop a substantially similar training program using materials, systems, or methods provided through this collaboration</li>
            <li>Solicit or redirect enrolled students, instructors, credential partners, or employers into a competing program derived from the Elevate training model</li>
            <li>Use Elevate's program structure, curriculum framework, or credential relationships to apply independently for ETPL status or workforce funding for a competing program</li>
            <li>License, sublicense, or transfer any Elevate program materials to any third party</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Compliance and Reporting" number={8}>
          <p>
            The Operating Company is responsible for all compliance reporting to state and federal
            workforce agencies, including the Indiana Department of Workforce Development, ETPL
            administration, and credential bodies. The Host Facility supports this by supplying:
          </p>
          <ul>
            <li>Daily attendance records within 24 hours of each session</li>
            <li>Incident reports within 24 hours of any safety or student concern</li>
            <li>Facility compliance documentation upon request</li>
            <li>Cooperation with any program audit or quality review within 5 business days of request</li>
          </ul>
          <p className="mt-3">
            All programs delivered under this Agreement must comply with federal nondiscrimination
            requirements under Title VI of the Civil Rights Act, Section 504 of the Rehabilitation
            Act, the Americans with Disabilities Act, and WIOA nondiscrimination provisions.
          </p>
        </DocumentSection>

        <DocumentSection heading="Site Approval and Quality Standards" number={9}>
          <p>
            Host Facility authorization is granted by the Operating Company following a site
            review. Authorization may be suspended or revoked if:
          </p>
          <ul>
            <li>Facility standards fall below the requirements in Section 4</li>
            <li>Insurance coverage lapses or is not renewed</li>
            <li>Attendance records are not submitted within required timeframes</li>
            <li>Student complaints indicate supervision or safety failures</li>
            <li>The Host Facility operates outside its designated tier without written authorization</li>
            <li>The Host Facility misrepresents its relationship with Elevate to students, funders, or the public</li>
          </ul>
          <p className="mt-3">
            The Operating Company will provide written notice of any compliance concern and allow
            10 business days for a written response before suspending authorization, except in
            cases involving immediate safety risk or material misrepresentation.
          </p>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={10}>
          <p>
            This Agreement is effective for one (1) year from execution and renews automatically
            for successive one-year terms unless either party provides 30 days written notice
            of non-renewal.
          </p>
          <p className="mt-3">
            The Operating Company may terminate immediately upon written notice if the Host Facility:
          </p>
          <ul>
            <li>Fails to maintain required insurance coverage</li>
            <li>Violates federal nondiscrimination requirements</li>
            <li>Misrepresents Elevate programs, credentials, or its relationship with Elevate</li>
            <li>Represents itself as a partner, co-owner, or governing authority of Elevate</li>
            <li>Modifies curriculum, tuition, or program structure without written authorization</li>
            <li>Engages in conduct that creates legal, reputational, or regulatory risk for the Training Network</li>
          </ul>
          <p className="mt-3">
            Either party may terminate for any other cause with 30 days written notice. Cohorts
            already in progress continue under this Agreement until completion.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law and Dispute Resolution" number={11}>
          <p>
            This Agreement is governed by the laws of the State of Indiana. Disputes shall first
            be submitted to good-faith mediation. If unresolved within 30 days, the parties
            consent to jurisdiction in Marion County, Indiana.
          </p>
          <p className="mt-3">
            For Host Facilities operating in states other than Indiana, this Agreement remains
            governed by Indiana law. The Operating Company's foreign entity registration in the
            Host Facility's state does not change the governing law of this Agreement.
          </p>
        </DocumentSection>

        <DocumentSection heading="Operating Company Contact" number={12}>
          <p>
            <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong><br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="mou"
          agreementVersion="1.0"
          buttonLabel="Sign Master Program Host Agreement"
          nextUrl="/partner/dashboard"
        />
      </DocumentPage>
    </>
  );
}
