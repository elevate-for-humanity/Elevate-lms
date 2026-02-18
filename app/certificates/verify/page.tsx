import { redirect } from 'next/navigation';

export default async function CertificatesVerifyRedirect({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; code?: string }>;
}) {
  const { id, code } = await searchParams;
  const params = new URLSearchParams();
  if (id) params.set('id', id);
  if (code) params.set('code', code);
  
  const query = params.toString();
  redirect(query ? `/verify?${query}` : '/verify');
}
