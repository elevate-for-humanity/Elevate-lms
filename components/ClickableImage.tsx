import Image from 'next/image';
import Link from 'next/link';

interface ClickableImageProps {
  src: string;
  alt: string;
  href?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  openInNewTab?: boolean;
}

export function ClickableImage({
  src,
  alt,
  href,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality = 100,
  sizes,
  objectFit = 'cover',
  openInNewTab = false,
}: ClickableImageProps) {
  const imageElement = fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      className={`object-${objectFit} ${className}`}
      quality={quality}
      priority={priority}
      sizes={sizes}
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      quality={quality}
      priority={priority}
      sizes={sizes}
    />
  );

  if (!href) {
    return imageElement;
  }

  // External link
  if (href.startsWith('http')) {
    return (
      <a
        href={href}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className="block"
      >
        {imageElement}
      </a>
    );
  }

  // Internal link
  return (
    <Link href={href} className="block">
      {imageElement}
    </Link>
  );
}
