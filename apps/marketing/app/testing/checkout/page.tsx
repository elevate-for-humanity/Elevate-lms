import { permanentRedirect } from 'next/navigation';

export default async function LegacyTestingCheckout({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['provider', 'exam', 'exam_name']) {
    const value = params[key];
    if (typeof value === 'string') query.set(key, value);
  }
  permanentRedirect(`/testing${query.size ? `?${query}` : ''}#booking`);
}
