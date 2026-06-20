import { notFound } from 'next/navigation';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!SLUG.test(category) || category.length > 200) notFound();

  return children;
}
