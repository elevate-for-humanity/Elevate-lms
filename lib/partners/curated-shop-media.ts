type ShopMedia = { url: string; alt?: string; source?: string };
export function curateShopGallery(slug: string, items: ShopMedia[]): ShopMedia[] {
  const generations = slug.startsWith('generations');
  const razor = slug.startsWith('razors-image');
  const seen = new Set<string>();
  return items.flatMap((item) => {
    if (razor && (item.url.includes('/2020/') || item.url.includes('apprenticeship-flyer') || item.url.includes('video-poster') || item.url.includes('owner-portrait'))) return [];
    if (generations && (item.url.includes('color-transformation.webp') || item.url.includes('dimensional-color.webp'))) return [
      { url: '/images/partners/generations-hair/dimensional-color-before-enhanced-2026.webp', alt: 'Generations Hair client before dimensional color service' },
      { url: '/images/partners/generations-hair/dimensional-color-after-enhanced-2026.webp', alt: 'Generations Hair finished dimensional color and styling' },
    ];
    if (generations && item.url.endsWith('/stylist-at-work.webp')) return [{ ...item, url: '/images/partners/generations-hair/stylist-at-work-enhanced-2026.webp' }];
    return [item];
  }).filter((item) => {
    const key = item.url.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
