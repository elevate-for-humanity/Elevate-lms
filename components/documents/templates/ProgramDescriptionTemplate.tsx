import { DocumentPage, DocumentSection } from '@/components/documents';

interface Props {
  programName: string;
  date?: string;
  version?: string;
  overview: string;
  background: string;
  description: string;
  structure: React.ReactNode;
  credentials: React.ReactNode;
  operationalModel: React.ReactNode;
  partnerships: React.ReactNode;
  compliance: React.ReactNode;
  implementation: React.ReactNode;
  summary: string;
}

/**
 * Standard Program Description template.
 * Use for ETPL submissions, workforce board reviews, and partner presentations.
 */
export function ProgramDescriptionTemplate({
  programName,
  date,
  version,
  overview,
  background,
  description,
  structure,
  credentials,
  operationalModel,
  partnerships,
  compliance,
  implementation,
  summary,
}: Props) {
  return (
    <DocumentPage
      documentType="Program Description"
      title={programName}
      date={date}
      version={version}
      confidential
    >
      <DocumentSection heading="Overview" number={1}>
        <p>{overview}</p>
      </DocumentSection>

      <DocumentSection heading="Background" number={2}>
        <p>{background}</p>
      </DocumentSection>

      <DocumentSection heading="Program Description" number={3}>
        <p>{description}</p>
      </DocumentSection>

      <DocumentSection heading="Structure and Components" number={4}>
        {structure}
      </DocumentSection>

      <DocumentSection heading="Credentials and Outcomes" number={5}>
        {credentials}
      </DocumentSection>

      <DocumentSection heading="Operational Model" number={6}>
        {operationalModel}
      </DocumentSection>

      <DocumentSection heading="Partnerships" number={7}>
        {partnerships}
      </DocumentSection>

      <DocumentSection heading="Compliance and Alignment" number={8}>
        {compliance}
      </DocumentSection>

      <DocumentSection heading="Implementation" number={9}>
        {implementation}
      </DocumentSection>

      <DocumentSection heading="Summary" number={10}>
        <p>{summary}</p>
      </DocumentSection>
    </DocumentPage>
  );
}
