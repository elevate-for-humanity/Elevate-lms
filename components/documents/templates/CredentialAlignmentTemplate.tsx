import { DocumentPage, DocumentSection } from '@/components/documents';

interface Props {
  credentialName: string;
  programName: string;
  date?: string;
  version?: string;
  overview: string;
  credentialDescription: string;
  issuingAuthority: React.ReactNode;
  alignmentToStandards: React.ReactNode;
  assessmentAndValidation: React.ReactNode;
  stackablePathways: React.ReactNode;
  employerRecognition: React.ReactNode;
  summary: string;
}

/**
 * Standard Credential Alignment Document template.
 * Use to demonstrate how a credential maps to industry standards,
 * employer needs, and stackable career pathways.
 */
export function CredentialAlignmentTemplate({
  credentialName,
  programName,
  date,
  version,
  overview,
  credentialDescription,
  issuingAuthority,
  alignmentToStandards,
  assessmentAndValidation,
  stackablePathways,
  employerRecognition,
  summary,
}: Props) {
  return (
    <DocumentPage
      documentType="Credential Alignment Document"
      title={credentialName}
      subtitle={`${programName} — Credential Alignment`}
      date={date}
      version={version}
    >
      <DocumentSection heading="Overview" number={1}>
        <p>{overview}</p>
      </DocumentSection>

      <DocumentSection heading="Credential Description" number={2}>
        <p>{credentialDescription}</p>
      </DocumentSection>

      <DocumentSection heading="Issuing Authority" number={3}>
        {issuingAuthority}
      </DocumentSection>

      <DocumentSection heading="Alignment to Standards" number={4}>
        {alignmentToStandards}
      </DocumentSection>

      <DocumentSection heading="Assessment and Validation" number={5}>
        {assessmentAndValidation}
      </DocumentSection>

      <DocumentSection heading="Stackable Pathways" number={6}>
        {stackablePathways}
      </DocumentSection>

      <DocumentSection heading="Employer Recognition" number={7}>
        {employerRecognition}
      </DocumentSection>

      <DocumentSection heading="Summary" number={8}>
        <p>{summary}</p>
      </DocumentSection>
    </DocumentPage>
  );
}
