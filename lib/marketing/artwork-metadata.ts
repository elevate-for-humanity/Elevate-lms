import type { Metadata } from 'next';

export function publicArtworkMetadata({
  path,
  image,
  alt,
  title,
  description,
}: {
  path: string;
  image: string;
  alt: string;
  title?: Metadata['title'];
  description?: string | null;
}): Metadata {
  const origin = 'https://www.elevateforhumanity.org';
  const pageTitle =
    typeof title === 'string'
      ? title
      : title && 'absolute' in title
        ? title.absolute
        : title && 'default' in title
          ? title.default
          : 'Elevate for Humanity';
  const url = new URL(path, origin).href;
  const artwork = new URL(image, origin).href;
  return {
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: pageTitle,
      description: description ?? undefined,
      url,
      siteName: 'Elevate for Humanity',
      locale: 'en_US',
      images: [{ url: artwork, alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: description ?? undefined,
      images: [artwork],
    },
  };
}
