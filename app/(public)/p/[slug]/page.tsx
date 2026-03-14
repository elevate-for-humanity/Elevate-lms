import { getPage } from '@/lib/data/pages';
import PageRenderer from '@/components/PageRenderer';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.meta_title ?? page.title ?? undefined,
    description: page.meta_desc ?? undefined,
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) notFound();

  return <PageRenderer sections={page.sections} />;
}
