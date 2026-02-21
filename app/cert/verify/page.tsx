import { redirect } from 'next/navigation';
import { siteMetadata } from '@/lib/seo/siteMetadata';

export const metadata = siteMetadata({
  title: 'Verify a Credential',
  description: 'Employer-facing credential verification. Confirm training completion and validate issued credentials quickly and securely.',
  path: '/cert/verify',
});

export default async function CertVerifyRedirect({
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
