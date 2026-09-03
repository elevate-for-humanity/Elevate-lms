import { DocumentPage, DocumentSection } from '@/components/documents';

interface Props {
  programName: string;
  submittedTo?: string;
  date?: string;
  version?: string;
  overview: string;
  backgroundAndNeed: string;
  programDescription: string;
  targetPopulation: React.ReactNode;
  credentials: React.ReactNode;
  deliveryModel: React.ReactNode;
  employerPartnerships: React.ReactNode;
  compliance: React.ReactNode;
  budgetAndFunding: React.ReactNode;
  implementationTimeline: React.ReactNode;
  summary: string;
}

/**
 * Standard Workforce / WIOA Submission template.
 * Use for ETPL applications, WIOA provider submissions,
 * and workforce board program approval requests.
 */
export function WorkforceSubmissionTemplate({
  programName,
  submittedTo,
  date,
  version,
  overview,
  backgroundAndNeed,
  programDescription,
  targetPopulation,
  credentials,
  deliveryModel,
  employerPartnerships,
  compliance,
  budgetAndFunding,
  implementationTimeline,
  summary,
}: Props) {
  return (
    <DocumentPage
      documentType="Workforce Program Submission"
      title={programName}
      subtitle={submittedTo ? `Submitted to ${submittedTo}` : undefined}
      date={date}
      version={version}
      confidential
    >
      <DocumentSection heading="Overview" number={1}>
        <p>{overview}</p>
      </DocumentSection>

      <DocumentSection heading="Background and Need" number={2}>
        <p>{backgroundAndNeed}</p>
      </DocumentSection>

      <DocumentSection heading="Program Description" number={3}>
        <p>{programDescription}</p>
      </DocumentSection>

      <DocumentSection heading="Target Population" number={4}>
        {targetPopulation}
      </DocumentSection>

      <DocumentSection heading="Credentials and Outcomes" number={5}>
        {credentials}
      </DocumentSection>

      <DocumentSection heading="Delivery Model" number={6}>
        {deliveryModel}
      </DocumentSection>

      <DocumentSection heading="Employer Partnerships" number={7}>
        {employerPartnerships}
      </DocumentSection>

      <DocumentSection heading="Compliance and Alignment" number={8}>
        {compliance}
      </DocumentSection>

      <DocumentSection heading="Budget and Funding" number={9}>
        {budgetAndFunding}
      </DocumentSection>

      <DocumentSection heading="Implementation Timeline" number={10}>
        {implementationTimeline}
      </DocumentSection>

      <DocumentSection heading="Summary" number={11}>
        <p>{summary}</p>
      </DocumentSection>
    </DocumentPage>
  );
}
