import { notFound } from 'next/navigation';
import { GaryCoordinatorLaunchKit } from '@/components/program-holder/GaryCoordinatorLaunchKit';
import { getProgramHolderWorkspace } from '@/lib/program-holder/workspace';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Gary Site Coordinator Launch Guide', robots: { index: false, follow: false } };

export default async function Page() {
  const data = await getProgramHolderWorkspace();
  if (data.mode === 'admin' || data.holder?.features?.approved_role !== 'Gary Regional Site Coordinator') notFound();
  return <GaryCoordinatorLaunchKit
    name={data.profile?.full_name || 'Gary Site Coordinator'}
    phone={data.profile?.phone || data.holder?.contact_phone}
    email={data.profile?.email || data.holder?.contact_email}
    agreementSigned={data.holder?.mou_signed === true}
    programCount={data.programs.length}
  />;
}
