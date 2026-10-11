type ShopMedia = { url: string; alt?: string; source?: string };
export function curateShopGallery(slug: string, items: ShopMedia[]): ShopMedia[] {
  const generations = slug.startsWith('generations');
  const kountry = slug.startsWith('kountry-kutz');
  const razor = slug.startsWith('razors-image');
  const seen = new Set<string>();
  return items.flatMap((item) => {
    if (kountry) {
      const filename = item.url.split('/').at(-1)?.split('?')[0];
      if (filename === 'interior-empty.webp' || filename === 'kountry-kutz-interior.webp') return [{ ...item, url: '/images/partners/kountry-kutz/interior-empty-enhanced-2026.webp' }];
      if (filename === 'interior-active.webp' || filename === 'kountry-kutz-active.webp') return [{ ...item, url: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp' }];
    }
    if (razor && (item.url.includes('/2020/') || item.url.includes('apprenticeship-flyer') || item.url.includes('video-poster') || item.url.includes('owner-portrait'))) return [];
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
