import Image, { type ImageProps } from 'next/image';

type LogoProps = Omit<ImageProps, 'src' | 'alt'> & {
  alt?: string;
};

/**
 * Canonical logo image. Pins quality=85 to match images.qualities config
 * and prevent server/client srcSet hydration mismatches.
 */
export default function Logo({
  alt = 'Elevate for Humanity',
  priority = false,
  ...props
}: LogoProps) {
  return (
    <Image
      src="/logo.jpg"
      alt={alt}
      quality={85}
      priority={priority}
      sizes="(max-width: 768px) 120px, 160px"
      {...props}
    />
  );
}
