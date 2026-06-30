export const dynamic = 'force-dynamic';
import { NAIL_TECH } from '@/data/programs/nail-technician-apprenticeship';
import { buildProgramMetadata, ProgramMarketingPage } from '@/lib/programs/program-page';

export const metadata = buildProgramMetadata(NAIL_TECH);

export default function ProgramPage() {
  return <ProgramMarketingPage program={NAIL_TECH} />;
}
