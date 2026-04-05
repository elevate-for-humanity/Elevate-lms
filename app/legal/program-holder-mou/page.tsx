import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { DocumentPage, DocumentSection, DocumentSignatureBlock } from '@/components/documents';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';


export const metadata: Metadata = {
  title: 'Program Holder MOU | Elevate for Humanity',
  robots: { index: false, follow: false },
};

export default async function ProgramHolderMOUPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');


  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Program Holder MOU' }]} />
      </div>
      <DocumentPage
        documentType="Memorandum of Understanding"
        title="Program Holder MOU"
        subtitle="Elevate for Humanity — Training Provider Partnership"
        date="2025-01-01"
        version="1.0"
        confidential
      >
        <DocumentSection heading="Parties" number={1}>
          <p>
            This Memorandum of Understanding is entered into between <strong>2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute</strong> ("Elevate"), and the Program Holder identified at the time of execution ("Program Holder").
          </p>
        </DocumentSection>

        <DocumentSection heading="Purpose" number={2}>
          <p>
            This MOU establishes the terms under which the Program Holder will deliver training programs through the Elevate for Humanity platform, including use of the LMS, credentialing infrastructure, and enrollment management systems.
          </p>
        </DocumentSection>

        <DocumentSection heading="Elevate Responsibilities" number={3}>
          <ul>
            <li>Provide LMS access and platform infrastructure for program delivery</li>
            <li>Manage student enrollment, progress tracking, and certificate issuance</li>
            <li>Coordinate funding applications (WIOA, WRG, Job Ready Indy) where applicable</li>
            <li>Maintain RAPIDS registration and DOL apprenticeship compliance</li>
            <li>Provide technical support and training for platform use</li>
            <li>Conduct compliance audits and quality assurance reviews</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Program Holder Responsibilities" number={4}>
          <ul>
            <li>Deliver training in accordance with the approved program curriculum</li>
            <li>Maintain all required state licenses, certifications, and insurance</li>
            <li>Submit attendance records, progress reports, and required documentation on time</li>
            <li>Ensure instructors meet all applicable qualification requirements</li>
            <li>Comply with WIOA, DOL, and applicable state workforce regulations</li>
            <li>Maintain a safe and professional training environment</li>
            <li>Report any incidents, complaints, or compliance issues to Elevate within 48 hours</li>
          </ul>
        </DocumentSection>

        <DocumentSection heading="Student Data and FERPA" number={5}>
          <p>
            The Program Holder agrees to handle all student data in compliance with FERPA and applicable state privacy laws. Student records may not be shared with third parties without written consent from Elevate and the student, except as required by law or funding compliance.
          </p>
        </DocumentSection>

        <DocumentSection heading="Revenue and Fees" number={6}>
          <p>
            Revenue sharing, platform fees, and payment terms are defined in the separate Program Holder Agreement executed at onboarding. This MOU does not supersede financial terms in that agreement.
          </p>
        </DocumentSection>

        <DocumentSection heading="Intellectual Property" number={7}>
          <p>
            Curriculum and training materials developed by Elevate remain the property of Elevate. Materials developed solely by the Program Holder remain their property. Jointly developed materials are owned equally unless otherwise agreed in writing.
          </p>
        </DocumentSection>

        <DocumentSection heading="Term and Termination" number={8}>
          <p>
            This MOU is effective for one (1) year from the date of execution and renews automatically unless either party provides 30 days written notice of non-renewal. Either party may terminate for cause with 10 days written notice. Elevate may terminate immediately for material breach, licensing violations, or student safety concerns.
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
          agreementType="program_holder_mou"
          agreementVersion="1.0"
          buttonLabel="Sign Program Holder MOU"
          nextUrl="/program-holder/dashboard"
        />
      </DocumentPage>
    </>
  );
}
