import { notFound } from 'next/navigation';

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseType: string }>;
}) {
  const { courseType } = await params;
  const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!SLUG.test(courseType) || courseType.length > 200) notFound();

  return children;
}
