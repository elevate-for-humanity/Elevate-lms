/** Public artwork metadata. Descriptions identify illustrations and actual shop photos accurately. */
export default function ImageMetadata({ src, description }: { src: string; description: string }) {
  if (!src.startsWith('/images/') || !description.trim()) return null;
  const url = new URL(src, 'https://www.elevateforhumanity.org').href;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ImageObject',
          contentUrl: url,
          url,
          name: description,
          description,
        }).replace(/</g, '\\u003c'),
      }}
    />
  );
}
