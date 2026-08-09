import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ApplicationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      query.set(key, value);
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      query.set(key, value[0]);
    }
  }

  if (query.get('type') === 'host-shop') {
    query.delete('type');
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    redirect(`/partners/host-shop/confirmation${suffix}`);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  redirect(`/apply/confirmation${suffix}`);
}
