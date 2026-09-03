import { DocumentPage, DocumentSection } from '@/components/documents';

interface Props {
  grantTitle: string;
  fundingSource?: string;
  date?: string;
  version?: string;
  overview: string;
  statementOfNeed: string;
  programDescription: string;
  goalsAndObjectives: React.ReactNode;
  targetPopulation: React.ReactNode;
  methodology: React.ReactNode;
  credentials: React.ReactNode;
  partnerships: React.ReactNode;
  sustainability: React.ReactNode;
  evaluationPlan: React.ReactNode;
  budgetJustification: React.ReactNode;
  summary: string;
}

/**
 * Standard Grant Narrative template.
 * Use for DOL grants, WIOA funding, state workforce grants,
 * and foundation proposals.
 */
export function GrantNarrativeTemplate({
  grantTitle,
  fundingSource,
  date,
  version,
  overview,
  statementOfNeed,
  programDescription,
  goalsAndObjectives,
  targetPopulation,
  methodology,
  credentials,
  partnerships,
  sustainability,
  evaluationPlan,
  budgetJustification,
  summary,
}: Props) {
  return (
    <DocumentPage
      documentType="Grant Narrative"
      title={grantTitle}
      subtitle={fundingSource ? `Submitted to ${fundingSource}` : undefined}
      date={date}
      version={version}
      confidential
    >
      <DocumentSection heading="Overview" number={1}>
        <p>{overview}</p>
      </DocumentSection>

      <DocumentSection heading="Statement of Need" number={2}>
        <p>{statementOfNeed}</p>
      </DocumentSection>

      <DocumentSection heading="Program Description" number={3}>
        <p>{programDescription}</p>
      </DocumentSection>

      <DocumentSection heading="Goals and Objectives" number={4}>
        {goalsAndObjectives}
      </DocumentSection>

      <DocumentSection heading="Target Population" number={5}>
        {targetPopulation}
      </DocumentSection>

      <DocumentSection heading="Methodology and Approach" number={6}>
        {methodology}
      </DocumentSection>

      <DocumentSection heading="Credentials and Outcomes" number={7}>
        {credentials}
      </DocumentSection>

      <DocumentSection heading="Partnerships" number={8}>
        {partnerships}
      </DocumentSection>

      <DocumentSection heading="Sustainability" number={9}>
        {sustainability}
      </DocumentSection>

      <DocumentSection heading="Evaluation Plan" number={10}>
        {evaluationPlan}
      </DocumentSection>

      <DocumentSection heading="Budget Justification" number={11}>
        {budgetJustification}
      </DocumentSection>

      <DocumentSection heading="Summary" number={12}>
        <p>{summary}</p>
      </DocumentSection>
    </DocumentPage>
  );
}
