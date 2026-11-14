import { DocumentPage, DocumentSection } from '@/components/documents';

interface Props {
  employerName: string;
  programName: string;
  date?: string;
  version?: string;
  referenceNumber?: string;
  overview: string;
  purpose: string;
  parties: React.ReactNode;
  employerCommitments: React.ReactNode;
  trainingProviderCommitments: React.ReactNode;
  apprenticeExpectations: React.ReactNode;
  termAndDuration: React.ReactNode;
  compliance: React.ReactNode;
  signatures?: React.ReactNode;
}

/**
 * Standard Employer Partnership Agreement template.
 * Use for OJT agreements, apprenticeship host site agreements,
 * and employer training partnerships.
 */
export function EmployerAgreementTemplate({
  employerName,
  programName,
  date,
  version,
  referenceNumber,
  overview,
  purpose,
  parties,
  employerCommitments,
  trainingProviderCommitments,
  apprenticeExpectations,
  termAndDuration,
  compliance,
  signatures,
}: Props) {
  return (
    <DocumentPage
      documentType="Employer Partnership Agreement"
      title={`${employerName} — ${programName}`}
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

      <DocumentSection heading="Employer Commitments" number={4}>
        {employerCommitments}
      </DocumentSection>

      <DocumentSection heading="Training Provider Commitments" number={5}>
        {trainingProviderCommitments}
      </DocumentSection>

      <DocumentSection heading="Apprentice or Trainee Expectations" number={6}>
        {apprenticeExpectations}
      </DocumentSection>

      <DocumentSection heading="Term and Duration" number={7}>
        {termAndDuration}
      </DocumentSection>

      <DocumentSection heading="Compliance" number={8}>
        {compliance}
      </DocumentSection>

      {signatures && (
        <DocumentSection heading="Signatures" number={9}>
          {signatures}
        </DocumentSection>
      )}
    </DocumentPage>
  );
}
