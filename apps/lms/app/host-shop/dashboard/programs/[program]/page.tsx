import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function HostShopProgramRedirect({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  await params;
  redirect('/host-shop/dashboard/programs');
}
