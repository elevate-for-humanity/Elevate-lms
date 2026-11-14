import { DocumentPage, DocumentSection } from '@/components/documents';

interface Party {
  name: string;
  title?: string;
  organization: string;
}

interface Props {
  title: string;
  date?: string;
  version?: string;
  referenceNumber?: string;
  overview: string;
  purpose: string;
  parties: React.ReactNode;
  scope: React.ReactNode;
  rolesAndResponsibilities: React.ReactNode;
  termAndDuration: React.ReactNode;
  compliance: React.ReactNode;
  modificationAndTermination: React.ReactNode;
  /** Signature block content */
  signatures?: React.ReactNode;
}

/**
 * Standard Memorandum of Understanding template.
 * Use for workforce board partnerships, employer agreements,
 * credential provider MOUs, and agency partnerships.
 */
export function MOUTemplate({
  title,
  date,
  version,
  referenceNumber,
  overview,
  purpose,
  parties,
  scope,
  rolesAndResponsibilities,
  termAndDuration,
  compliance,
  modificationAndTermination,
  signatures,
}: Props) {
  return (
    <DocumentPage
      documentType="Memorandum of Understanding"
      title={title}
      date={date}
      version={version}
      referenceNumber={referenceNumber}
      confidential
    >
      <DocumentSection heading="Overview" number={1}>
        <p>{overview}</p>
      </DocumentSection>

      <DocumentSection heading="Purpose" number={2}>
        <p>{purpose}</p>
      </DocumentSection>

      <DocumentSection heading="Parties" number={3}>
        {parties}
      </DocumentSection>

      <DocumentSection heading="Scope of Agreement" number={4}>
        {scope}
      </DocumentSection>

      <DocumentSection heading="Roles and Responsibilities" number={5}>
        {rolesAndResponsibilities}
      </DocumentSection>

      <DocumentSection heading="Term and Duration" number={6}>
        {termAndDuration}
      </DocumentSection>

      <DocumentSection heading="Compliance and Standards" number={7}>
        {compliance}
      </DocumentSection>

      <DocumentSection heading="Modification and Termination" number={8}>
        {modificationAndTermination}
      </DocumentSection>

      {signatures && (
        <DocumentSection heading="Signatures" number={9}>
          {signatures}
        </DocumentSection>
      )}
    </DocumentPage>
  );
}
