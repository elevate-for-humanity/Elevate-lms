export const dynamic = 'force-dynamic';
import { HVAC_TECHNICIAN } from '@/data/programs/hvac-technician';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(HVAC_TECHNICIAN);

export default function ProgramPage() {
  return <ProgramMarketingPage program={HVAC_TECHNICIAN} />;
}
