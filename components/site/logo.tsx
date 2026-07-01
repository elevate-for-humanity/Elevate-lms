import Image from 'next/image';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type SiteLogoProps = {
  className?: string;
};

export function SiteLogo({ className }: SiteLogoProps) {
  return (
    <Link href="/" aria-label="Link" className={className ?? ''}>
      <Image
        src="/logo-small.png"
        alt={`${PLATFORM_DEFAULTS.orgName} – Building Success Stories`}
        width={96}
        height={96}
        priority
        className="h-10 w-auto" sizes="(max-width: 768px) 100vw, 50vw"
      />
    </Link>
  );
}
