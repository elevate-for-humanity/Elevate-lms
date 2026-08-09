import { redirect } from 'next/navigation';

export default async function LegacyHostShopApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const program = params?.program?.trim();
  redirect(`/partners/host-shop/apply${program ? `?program=${encodeURIComponent(program)}` : ''}`);
}
