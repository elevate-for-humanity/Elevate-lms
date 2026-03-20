/**
 * CanonicalImage — canonical wrapper for hero and marketing surface images.
 *
 * Enforces:
 *   - Local path only (template literal type blocks remote URLs at compile time)
 *   - Non-empty alt text (throws in development if empty)
 *
 * Use this for hero images, program images, and marketing section images.
 * Do NOT use this for user-generated content (avatars, uploads) — those
 * come from Supabase storage and require dynamic URLs.
 *
 * For fill-mode images (absolute inset), use Next.js Image directly with
 * fill prop — CanonicalImage is for sized images with explicit dimensions.
 */

import Image from 'next/image';

type Props = {
  /** Local static path only. Blocks remote URLs at compile time. */
  src: `/${string}`;
  /** Required. Must be meaningful — not empty, not "image". */
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export default function CanonicalImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
}: Props) {
  if (process.env.NODE_ENV === 'development') {
    if (!alt.trim()) {
      throw new Error('CanonicalImage requires meaningful alt text. Use aria-hidden="true" on the parent if this is purely decorative.');
    }
    if (alt.toLowerCase() === 'image' || alt.toLowerCase() === 'photo' || alt.toLowerCase() === 'picture') {
      throw new Error(`CanonicalImage alt="${alt}" is not meaningful. Describe what the image shows.`);
    }
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
}
