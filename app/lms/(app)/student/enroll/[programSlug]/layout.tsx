import { notFound } from 'next/navigation';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ programSlug: string }>;
}) {
  const { programSlug } = await params;
  const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!SLUG.test(programSlug) || programSlug.length > 200) notFound();

  return children;
}
