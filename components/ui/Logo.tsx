import Image, { type ImageProps } from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type LogoProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string;
};

/**
 * Canonical logo image. Pins quality=85 to match images.qualities config
 * and prevent server/client srcSet hydration mismatches.
 */
export default function Logo({
  alt = PLATFORM_DEFAULTS.orgName,
  priority = false,
  style,
  ...props
}: LogoProps) {
  return (
    <Image
      src="/logo.jpg"
      alt={alt}
      quality={85}
      priority={priority}
      sizes="(max-width: 768px) 120px, 160px"
      style={{ width: 'auto', ...style }}
      {...props}
    />
  );
}
