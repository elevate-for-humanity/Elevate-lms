import { permanentRedirect } from 'next/navigation';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

export default async function LegacyTestingProvider({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  permanentRedirect(
    CERT_PROVIDERS[provider]?.publicVisible !== false && CERT_PROVIDERS[provider]
      ? `/testing#${encodeURIComponent(provider)}`
      : '/testing',
  );
}
