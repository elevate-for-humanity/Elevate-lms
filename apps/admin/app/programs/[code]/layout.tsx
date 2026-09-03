import { notFound } from 'next/navigation';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!SLUG.test(code) || code.length > 200) notFound();

  return children;
}
