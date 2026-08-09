import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default async function LegacyAdminAlias({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  permanentRedirect(`/programs/${encodeURIComponent(code)}/manage`);
}
