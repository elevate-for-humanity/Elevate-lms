export const dynamic = 'force-dynamic';
import { ELECTRICAL } from '@/data/programs/electrical';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(ELECTRICAL);

export default function ProgramPage() {
  return <ProgramMarketingPage program={ELECTRICAL} />;
}
