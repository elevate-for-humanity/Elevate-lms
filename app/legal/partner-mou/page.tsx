import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';

export const metadata: Metadata = {
  title: 'Partner MOU | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default function PartnerMOUPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Partner MOU' }]} />
      </div>
      <DocumentPage
        documentType="Memorandum of Understanding"
        title="Partner MOU"
        subtitle="Elevate for Humanity — Community & Workforce Partnership"
        date="2025-01-01"
        version="1.0"
        confidential
      >
        <DocumentSection heading="Parties" number={1}>
          <p>
            This Memorandum of Understanding is entered into between <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong> ("Elevate") and the partner organization identified at the time of execution ("Partner").
          </p>
        </DocumentSection>

        <DocumentSection heading="Purpose" number={2}>
          <p>
            This MOU establishes a collaborative partnership to expand access to career training, credentialing, and workforce development services for shared communities and populations.
          </p>
        </DocumentSection>

        <DocumentSection heading="Scope of Partnership" number={3}>
          <p>The parties agree to collaborate on one or more of the following:</p>
          <ul>
            <li>Student referral and co-enrollment in Elevate programs</li>
            <li>Joint outreach and community engagement events</li>
            <li>Shared use of training facilities or resources</li>
            <li>Co-application for workforce development grants</li>
            <li>Data sharing for program evaluation and reporting (subject to FERPA and applicable law)</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Elevate Responsibilities" number={4}>
          <ul>
            <li>Provide program information, enrollment support, and LMS access for referred students</li>
            <li>Maintain all required licenses, registrations, and compliance certifications</li>
            <li>Provide the Partner with regular updates on referred student progress (with student consent)</li>
            <li>Represent the partnership accurately in all public communications</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Partner Responsibilities" number={5}>
          <ul>
            <li>Refer eligible individuals to Elevate programs in good faith</li>
            <li>Provide accurate information about Elevate programs to referred individuals</li>
            <li>Maintain confidentiality of any shared student or organizational data</li>
            <li>Comply with all applicable laws in the performance of partnership activities</li>
            <li>Notify Elevate of any changes in organizational status, licensing, or leadership within 30 days</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Data Sharing and Privacy" number={6}>
          <p>
            Any student data shared between the parties requires written student consent and must comply with FERPA, HIPAA (where applicable), and Indiana privacy law. Neither party may sell or disclose shared data to third parties without written consent from the other party and the student.
          </p>
        </DocumentSection>

        <DocumentSection heading="Branding and Communications" number={7}>
          <p>
            Neither party may use the other's name, logo, or marks in public communications without prior written approval. Joint press releases and marketing materials require review and sign-off from both parties.
          </p>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={8}>
          <p>
            This MOU is effective for one (1) year from execution and renews automatically unless either party provides 30 days written notice of non-renewal. Either party may terminate for cause with 10 days written notice.
          </p>
        </DocumentSection>

        <DocumentSection heading="Governing Law" number={9}>
          <p>
            This MOU is governed by the laws of the State of Indiana. Disputes shall be resolved in Marion County, Indiana.
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
          agreementType="mou"
          agreementVersion="1.0"
          buttonLabel="Sign Partner MOU"
          nextUrl="/partner/dashboard"
        />
      </DocumentPage>
    </>
  );
}
