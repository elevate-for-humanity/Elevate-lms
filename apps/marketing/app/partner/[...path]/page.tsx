/**
 * Partner catch-all redirect
 * All /partner/* routes now point to /host-shop/*
 */
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export default async function PartnerCatchAll({ params }: PageProps) {
  const { path } = await params;
  const pathStr = path.join('/');
  redirect(`/host-shop/${pathStr}`);
}
