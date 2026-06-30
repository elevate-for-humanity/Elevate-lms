export const dynamic = 'force-dynamic';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(COSMETOLOGY);

export default function ProgramPage() {
  return <ProgramMarketingPage program={COSMETOLOGY} />;
}
