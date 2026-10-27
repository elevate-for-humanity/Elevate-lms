// Optimized copies of the shop’s published portfolio; source URLs remain credited.
const LOCAL_SHOP_MEDIA: Record<string, string> = {
  "https://bucket.setmore.com/files/img/fRYGyv7MVdze/f942496e-3d23-4bc1-8368-e8347feef0c0.jpeg": "/images/partners/paola-petit/official-portfolio-1-2026.webp",
  "https://bucket.setmore.com/files/img/foUM2ORMO8wH/4769cf9f-8ad1-4281-8183-5f81ff6ba582.jpeg": "/images/partners/paola-petit/official-portfolio-2-2026.webp",
  "https://bucket.setmore.com/files/img/fp0P2PShLRhm/4a14954f-69d2-4990-ac2e-9f0300d29a1f.jpeg": "/images/partners/paola-petit/official-portfolio-2-2026.webp"
};
type ShopMedia = { url: string; alt?: string; source?: string };
export function curateShopGallery(slug: string, items: ShopMedia[]): ShopMedia[] {
  const generations = slug.startsWith('generations');
  const kountry = slug.startsWith('kountry-kutz');
  const seen = new Set<string>();
  return items.flatMap((original) => {
    const localUrl = LOCAL_SHOP_MEDIA[original.url];
    let item = localUrl ? { ...original, url: localUrl, source: original.source || original.url } : original;
    // First-party imports should use repository asset paths. Normalize them
    // before deduplication so an absolute URL and its repository path form one slide.
    try {
      const parsed = new URL(item.url, 'https://www.elevateforhumanity.org');
      if (parsed.hostname === 'www.elevateforhumanity.org' || parsed.hostname === 'elevateforhumanity.org') {
        item = { ...item, url: parsed.pathname + parsed.search };
      }
    } catch { return []; }
    if (item.url === '/images/partners/salon-saloon/team-interior.webp') return [{ ...item, url: '/images/partners/salon-saloon/team-interior-enhanced-2026.webp' }];
    if (kountry) {
      const filename = item.url.split('/').at(-1)?.split('?')[0];
      if (filename === 'interior-empty.webp' || filename === 'kountry-kutz-interior.webp') return [{ ...item, url: '/images/partners/kountry-kutz/interior-empty-enhanced-2026.webp' }];
      if (filename === 'interior-active.webp' || filename === 'kountry-kutz-active.webp') return [{ ...item, url: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp' }];
    }
    if (generations && (item.url.includes('color-transformation.webp') || item.url.includes('dimensional-color.webp'))) return [
      { url: '/images/partners/generations-hair/dimensional-color-before-enhanced-2026.webp', alt: 'Generations Hair client before dimensional color service' },
      { url: '/images/partners/generations-hair/dimensional-color-after-enhanced-2026.webp', alt: 'Generations Hair finished dimensional color and styling' },
    ];
    if (generations && item.url.split('/').at(-1) === 'stylist-at-work.webp') return [{ ...item, url: '/images/partners/generations-hair/stylist-at-work-enhanced-2026.webp' }];
    return [item];
  }).filter((item) => {
    if (!item.url.trim()) return false;
    let key = item.url.trim();
    try {
      const url = new URL(key, 'https://www.elevateforhumanity.org');
      key = url.origin === 'https://www.elevateforhumanity.org' ? url.pathname : url.href;
    } catch {
      return false;
    }
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
