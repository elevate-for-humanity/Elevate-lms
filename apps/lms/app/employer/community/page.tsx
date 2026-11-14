import SocialLearningCommunity from '@/components/SocialLearningCommunity';
import { BusinessNetworkCard } from '@/components/portal/BusinessNetworkCard';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Employer Community', robots: { index: false, follow: false } };
export default async function Page() {
  const { user, profile } = await requireRole(['employer', 'sponsor']);
  return <main className="mx-auto max-w-7xl px-4 py-6"><BusinessNetworkCard href="#network-feed" label="Employer community" /><div id="network-feed"><SocialLearningCommunity userId={user.id} userName={profile.full_name || 'Employer'} /></div></main>;
}
