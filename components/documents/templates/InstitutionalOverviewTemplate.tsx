import { DocumentPage, DocumentSection } from '@/components/documents';

interface Props {
  date?: string;
  version?: string;
  overview: string;
  missionAndBackground: string;
  programsOffered: React.ReactNode;
  credentials: React.ReactNode;
  deliveryModel: React.ReactNode;
  partnerships: React.ReactNode;
  compliance: React.ReactNode;
  summary: string;
}

/**
 * Standard Institutional Overview template.
 * Use as the master "about us" document for workforce boards,
 * state agencies, and credential partners.
 */
export function InstitutionalOverviewTemplate({
  date,
  version,
  overview,
  missionAndBackground,
  programsOffered,
  credentials,
  deliveryModel,
  partnerships,
  compliance,
  summary,
}: Props) {
  return (
    <DocumentPage
      documentType="Institutional Overview"
      title="Elevate for Humanity"
      subtitle="Workforce Development and Career Training"
      date={date}
      version={version}
    >
      <DocumentSection heading="Overview" number={1}>
        <p>{overview}</p>
      </DocumentSection>

      <DocumentSection heading="Mission and Background" number={2}>
        <p>{missionAndBackground}</p>
      </DocumentSection>

      <DocumentSection heading="Programs Offered" number={3}>
        {programsOffered}
      </DocumentSection>

      <DocumentSection heading="Credentials and Outcomes" number={4}>
        {credentials}
      </DocumentSection>

      <DocumentSection heading="Delivery Model" number={5}>
        {deliveryModel}
      </DocumentSection>

      <DocumentSection heading="Partnerships and Affiliations" number={6}>
        {partnerships}
      </DocumentSection>

      <DocumentSection heading="Compliance and Approvals" number={7}>
        {compliance}
      </DocumentSection>

      <DocumentSection heading="Summary" number={8}>
        <p>{summary}</p>
      </DocumentSection>
    </DocumentPage>
  );
}
