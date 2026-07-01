import Image, { type ImageProps } from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type LogoImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string;
};

/**
 * Single source of truth for the Elevate logo image.
 * Pins quality=85 to match images.qualities config and prevent
 * server/client hydration mismatches from differing quality defaults.
 */
export default function LogoImage({
  alt = PLATFORM_DEFAULTS.orgName,
  quality = 85,
  style,
  ...props
}: LogoImageProps) {
  return <Image src="/logo.png" alt={alt} quality={quality} style={{ width: 'auto', ...style }} {...props} />;
}
