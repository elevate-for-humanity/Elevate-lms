export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { PEER_RECOVERY } from '@/data/programs/peer-recovery-specialist';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: PEER_RECOVERY.metaTitle ?? `${PEER_RECOVERY.title} | ${PLATFORM_DEFAULTS.orgName}`,
  description: PEER_RECOVERY.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/peer-recovery-specialist' },
};

export default function PeerRecoverySpecialistPage() {
  return <ProgramDetailPage program={PEER_RECOVERY} />;
}
