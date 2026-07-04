export const dynamic = 'force-dynamic';
import { MEDICAL_ASSISTANT } from '@/data/programs/medical-assistant';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(MEDICAL_ASSISTANT);

export default function ProgramPage() {
  return <ProgramMarketingPage program={MEDICAL_ASSISTANT} />;
}
