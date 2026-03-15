import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Training Network Partner Agreement | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function PartnerMOUPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Training Network Partner Agreement' }]} />
      </div>
      <DocumentPage
        documentType="Memorandum of Understanding"
        title="Training Network Partner Agreement"
        subtitle="Elevate for Humanity Career & Training Institute — Indiana Workforce Training Network"
        date="2025-01-01"
        version="3.0"
        confidential
      >

        <DocumentSection heading="Parties" number={1}>
          <p>
            This Memorandum of Understanding ("Agreement") is entered into between{' '}
            <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong>{' '}
            ("Program Owner" or "Elevate"), a workforce training provider operating under Indiana law,
            and the collaborating organization identified at the time of execution ("Collaborating Party").
          </p>
        </DocumentSection>

        <DocumentSection heading="Definition of Partnership — and Why This Is Not One" number={2}>
          <p>
            For the purposes of clarity and legal precision, a <strong>"partnership"</strong> is defined
            as a business relationship in which two or more parties jointly own and operate a business
            enterprise, share governance authority, share profits and losses, and maintain equal or
            negotiated control over business operations, including pricing, staffing, branding, and
            strategic direction.
          </p>
          <p className="mt-3">
            <strong>This Agreement does not create a partnership, joint venture, co-ownership
            arrangement, franchise relationship, or employment relationship</strong> between the parties.
            No party shall represent itself as a partner, co-owner, co-founder, or governing authority
            of the other in any public communication, grant application, funding proposal, or legal
            document.
          </p>
          <p className="mt-3">
            All program ownership, curriculum, intellectual property, tuition structures, credential
            relationships, and operational systems remain the sole property and exclusive authority of
            Elevate for Humanity. The Collaborating Party participates solely in the role designated
            in Section 5 of this Agreement.
          </p>
        </DocumentSection>

        <DocumentSection heading="Nature of the Collaboration" number={3}>
          <p>
            This Agreement establishes a collaborative training arrangement in which Elevate for Humanity
            serves as the Program Owner and Primary Training Provider. The Collaborating Party supports
            program delivery through facility hosting, program facilitation, or student referral as
            defined in Section 5.
          </p>
          <p className="mt-3">
            Elevate retains sole authority over program design, curriculum, learning platforms, tuition
            structures, credential alignment, branding, compliance standards, and all student program
            policies. The Collaborating Party does not obtain ownership rights, licensing rights,
            governance authority, or decision-making authority over the training program or its
            operations through this Agreement.
          </p>
        </DocumentSection>

        <DocumentSection heading="Training Network Model" number={4}>
          <p>
            Elevate for Humanity operates a <strong>Training Network Model</strong> in which Elevate
            serves as the sole Program Owner and Primary Training Provider. Authorized organizations
            participate as approved Training Network Sites for the purpose of delivering in-person or
            hybrid components of the program under Elevate's standardized delivery model.
          </p>
          <p className="mt-3">
            Elevate retains sole authority to expand the training program into additional states and
            jurisdictions. Expansion into additional states or training regions may occur through the
            approval of new Program Hosts or delivery sites without requiring approval from existing
            collaborators.
          </p>
          <p className="mt-3">
            Elevate operates as an eligible training provider under Indiana's INTraining / Eligible
            Training Provider List (ETPL) system, administered by the Indiana Department of Workforce
            Development (DWD). The Collaborating Party does not hold ETPL status independently under
            this Agreement and may not represent itself as a training provider for Elevate programs
            without written authorization. All programs delivered under this Agreement must comply with
            federal nondiscrimination requirements under Title VI, Section 504, the ADA, and WIOA.
          </p>
        </DocumentSection>

        <DocumentSection heading="Participation Tiers" number={5}>
          <p>
            The Collaborating Party participates under one of the following tiers, as designated in
            Schedule A. Elevate reserves the right to reclassify a Collaborating Party's tier upon
            30 days written notice if the party's actual contributions change.
          </p>

          <h4 className="font-bold text-slate-800 mt-6 mb-1">Tier 1 — Facility Host</h4>
          <p className="text-sm text-slate-600 mb-3">
            Provides a dedicated physical training facility and on-site operational support for the
            full cohort duration.
          </p>
          <p className="font-semibold text-sm">Facility Requirements:</p>
          <ul>
            <li>Dedicated classroom or training space for the enrolled cohort</li>
            <li>Seating and workstations sufficient for all enrolled students</li>
            <li>Reliable broadband internet access</li>
            <li>Environment compliant with local building codes and fire safety requirements</li>
            <li>ADA-accessible facility</li>
          </ul>
          <p className="font-semibold text-sm mt-3">Operational Requirements:</p>
          <ul>
            <li>Facility available for all scheduled training hours for the full cohort duration</li>
            <li>Designated on-site coordinator assigned for each cohort</li>
            <li>Attendance monitoring and student supervision during in-person sessions</li>
            <li>Coordination with Elevate program staff</li>
          </ul>
          <p className="font-semibold text-sm mt-3">Compliance Requirements:</p>
          <ul>
            <li>General liability insurance (minimum $1,000,000 per occurrence / $2,000,000 aggregate)</li>
            <li>Facility/property insurance covering the training space</li>
            <li>Workers' compensation coverage if facility staff are present during training</li>
            <li>Elevate named as additional insured on the facility liability policy</li>
            <li>Written certification of ADA and federal nondiscrimination compliance</li>
          </ul>
          <p className="font-semibold text-sm mt-3">Compensation:</p>
          <p className="text-sm">
            One-third (1/3) of net program revenue per cohort, paid within 30 days of cohort
            completion and final reconciliation. Net revenue is defined in Section 7.
          </p>

          <h4 className="font-bold text-slate-800 mt-6 mb-1">Tier 2 — Coordination Partner</h4>
          <p className="text-sm text-slate-600 mb-3">
            Provides student coordination and supervision support. Does not provide a training facility.
          </p>
          <p className="font-semibold text-sm">Responsibilities:</p>
          <ul>
            <li>Student coordination and communication throughout the program</li>
            <li>Attendance tracking and reporting to Elevate within 48 hours of each session</li>
            <li>Supervision support during hybrid or in-person sessions at Elevate-provided locations</li>
            <li>Liaison between enrolled students and Elevate program staff</li>
          </ul>
          <p className="font-semibold text-sm mt-3">Compensation:</p>
          <p className="text-sm">
            Fifteen percent (15%) of net program revenue per cohort, paid within 30 days of cohort
            completion and final reconciliation.
          </p>

          <h4 className="font-bold text-slate-800 mt-6 mb-1">Tier 3 — Referral Partner</h4>
          <p className="text-sm text-slate-600 mb-3">
            Refers eligible individuals to Elevate programs. No operational responsibility for
            program delivery.
          </p>
          <p className="font-semibold text-sm">Responsibilities:</p>
          <ul>
            <li>Referral of eligible individuals to Elevate enrollment</li>
            <li>Community outreach and awareness activities</li>
            <li>Accurate representation of Elevate programs to referred individuals</li>
          </ul>
          <p className="font-semibold text-sm mt-3">Compensation:</p>
          <p className="text-sm">
            A flat referral fee of <strong>$250 to $500 per enrolled student</strong> as specified in
            Schedule A, paid upon confirmed enrollment and initial tuition payment. Referral partners
            do not receive revenue share.
          </p>
        </DocumentSection>

        <DocumentSection heading="Employer Participation" number={6}>
          <p>
            Employers participating in work-based learning, job shadowing, internships, or hiring
            pipelines must comply with all applicable wage and labor laws. Employer participation does
            not create a training provider relationship or entitle the employer to program revenue.
          </p>
          <ul className="mt-3">
            <li><strong>Option A — Paid Trainee:</strong> Employer pays the trainee an hourly wage during the work-based learning period.</li>
            <li><strong>Option B — Work-Based Learning Stipend:</strong> Employer provides a stipend during the training period.</li>
            <li><strong>Option C — Hire Upon Completion:</strong> Employer commits to hiring graduates upon credential completion under a separate employer agreement.</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Operational Costs and Net Revenue" number={7}>
          <p>
            Revenue sharing is calculated on <strong>net program revenue</strong> — gross tuition
            collected minus the following operational costs:
          </p>
          <ul>
            <li>Credential exam fees and testing administration</li>
            <li>LMS licensing and technology infrastructure</li>
            <li>Curriculum development and maintenance</li>
            <li>Marketing, recruitment, and student outreach</li>
            <li>Compliance, reporting, and ETPL administration</li>
            <li>Program administration and management</li>
            <li>Payment processing fees</li>
            <li>Insurance and legal compliance</li>
            <li>Student services and support</li>
          </ul>
          <p className="mt-3">
            Elevate will provide a written cost reconciliation within 15 days of cohort completion.
            The Collaborating Party may request supporting documentation within 10 days of receipt.
          </p>
        </DocumentSection>

        <DocumentSection heading="Program Ownership and Intellectual Property" number={8}>
          <p>
            All curriculum materials, instructional content, learning management systems, operational
            procedures, branding, credential alignments, and program methodologies used in Elevate
            programs constitute <strong>proprietary intellectual property owned exclusively by
            Elevate for Humanity</strong>.
          </p>
          <p className="mt-3">
            Training Network Sites receive limited, non-transferable authorization to deliver program
            components solely for the purpose of supporting approved training cohorts under this
            Agreement. This authorization terminates automatically upon expiration or termination of
            this Agreement.
          </p>
          <p className="mt-3">
            The Collaborating Party acquires no ownership interest, license, or right to replicate,
            sublicense, or independently operate any Elevate program.
          </p>
        </DocumentSection>

        <DocumentSection heading="Non-Replication and Non-Circumvention" number={9}>
          <p>
            The Collaborating Party acknowledges that the training model, curriculum, instructional
            materials, operational systems, credential alignments, and program structure used by
            Elevate constitute proprietary intellectual property.
          </p>
          <p className="mt-3">
            The Collaborating Party agrees that during the term of this Agreement and for a period of{' '}
            <strong>three (3) years following termination</strong>, it will not directly or indirectly:
          </p>
          <ul>
            <li>Replicate, reproduce, or develop a substantially similar training program using the materials, systems, or methods provided through this collaboration</li>
            <li>Solicit or redirect enrolled trainees, instructors, credential partners, or participating employers into a competing program derived from the Elevate training model</li>
            <li>Use Elevate's program structure, curriculum framework, or credential relationships to apply independently for ETPL status or workforce funding for a competing program</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Authority and Program Control" number={10}>
          <p>
            All decisions regarding tuition pricing, curriculum content, credential partnerships,
            program policies, instructional standards, student eligibility, and training delivery
            methods remain under the <strong>exclusive authority of Elevate for Humanity</strong>.
          </p>
          <p className="mt-3">
            The Collaborating Party may not modify program structure, tuition rates, curriculum
            materials, or credential requirements without written authorization from Elevate.
            Unauthorized modifications constitute grounds for immediate termination under Section 12.
          </p>
        </DocumentSection>

        <DocumentSection heading="Student Enrollment and Ownership" number={11}>
          <p>
            All students enrolled in Elevate programs remain participants of the Elevate training
            program regardless of the training location where in-person components are delivered.
            Student records, enrollment data, and credential progress are maintained exclusively
            by Elevate.
          </p>
          <p className="mt-3">
            Collaborating Parties do not obtain ownership rights over student enrollment, tuition
            structures, credential access, or post-program placement services. Student data shared
            with Collaborating Parties is governed by FERPA and requires written student consent.
            Attendance records must be submitted to Elevate within 48 hours of each session.
          </p>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={12}>
          <p>
            This Agreement is effective for one (1) year from execution and renews automatically
            for successive one-year terms unless either party provides 30 days written notice of
            non-renewal.
          </p>
          <p className="mt-3">
            Elevate may terminate immediately upon written notice if the Collaborating Party:
          </p>
          <ul>
            <li>Fails to maintain required insurance coverage</li>
            <li>Violates federal nondiscrimination requirements</li>
            <li>Misrepresents Elevate programs or credentials to students or funders</li>
            <li>Represents itself as a partner, co-owner, or governing authority of Elevate</li>
            <li>Operates outside its designated tier without written authorization</li>
            <li>Modifies curriculum, tuition, or program structure without written authorization</li>
            <li>Fails to remit required documentation within specified timeframes</li>
          </ul>
          <p className="mt-3">
            Either party may terminate for any other cause with 30 days written notice. Cohorts
            already in progress continue under this Agreement until completion.
          </p>
        </DocumentSection>

        <DocumentSection heading="Insurance Requirements" number={13}>
          <p><strong>Elevate carries:</strong> professional liability, instructional liability, and technology/LMS coverage.</p>
          <p className="mt-3"><strong>Tier 1 Facility Hosts must carry:</strong></p>
          <ul>
            <li>General liability (minimum $1,000,000 per occurrence / $2,000,000 aggregate)</li>
            <li>Facility/property insurance covering the training space</li>
            <li>Workers' compensation if facility staff are present during training</li>
          </ul>
          <p className="mt-3">
            Proof of insurance must be provided before the first cohort and upon each annual renewal.
            Elevate must be named as additional insured on the Tier 1 facility policy.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law and Dispute Resolution" number={14}>
          <p>
            This Agreement is governed by the laws of the State of Indiana. Disputes shall first be
            submitted to good-faith mediation. If unresolved within 30 days, the parties consent to
            jurisdiction in Marion County, Indiana.
          </p>
        </DocumentSection>

        <DocumentSection heading="Program Owner Contact" number={15}>
          <p>
            <strong>Elevate for Humanity Career &amp; Training Institute</strong><br />
            2Exclusive LLC-S d/b/a Elevate for Humanity<br />
            8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240<br />
            Email: info@elevateforhumanity.org · Phone: (317) 314-3757
          </p>
        </DocumentSection>

        <DocumentSignatureBlock
          agreementType="mou"
          agreementVersion="3.0"
          buttonLabel="Sign Training Network Partner Agreement"
          nextUrl="/partner/dashboard"
        />
      </DocumentPage>
    </>
  );
}
