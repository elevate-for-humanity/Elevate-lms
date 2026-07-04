export const dynamic = 'force-dynamic';
import { CPR_FIRST_AID } from '@/data/programs/cpr-first-aid';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(CPR_FIRST_AID);

export default function CprFirstAidPage() {
  return <ProgramMarketingPage program={CPR_FIRST_AID} />;
}
