export const dynamic = 'force-dynamic';
import { CNA } from '@/data/programs/cna';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(CNA);

export default function ProgramPage() {
  return <ProgramMarketingPage program={CNA} />;
}
