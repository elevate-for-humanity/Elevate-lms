export const dynamic = 'force-dynamic';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(ESTHETICIAN_APPRENTICESHIP);

export default function ProgramPage() {
  return <ProgramMarketingPage program={ESTHETICIAN_APPRENTICESHIP} />;
}
