import { STATIC_PROGRAM_MAP } from '@/data/programs';
import { PROGRAM_IMAGES } from '@/lib/images/programImages';
import pageImages from '@/lib/marketing/public-page-images.json';

export const dynamic = 'force-static';
const origin = 'https://www.elevateforhumanity.org';
function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
export function GET() {
  const pages = new Map<string, { image: string; description: string }[]>();
  for (const page of pageImages)
    pages.set(page.path, [{ image: page.image, description: page.description }]);
  for (const slug of STATIC_PROGRAM_MAP.keys()) {
    const entry = PROGRAM_IMAGES[slug];
    if (!entry) continue;
    pages.set(
      `/programs/${slug}`,
      [...new Set([entry.hero, entry.card])]
        .filter((image) => image.startsWith('/images/'))
        .map((image) => ({ image, description: entry.alt })),
    );
  }
  const entries = [...pages]
    .filter(([, images]) => images.length)
    .map(
      ([path, images]) =>
        `<url><loc>${escapeXml(new URL(path, origin).href)}</loc>${images.map((image) => `<image:image><image:loc>${escapeXml(new URL(image.image, origin).href)}</image:loc></image:image>`).join('')}</url>`,
    );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries.join('')}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
