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
    // Retired purple room mockup must not return through an older database gallery.
    if (slug.startsWith('prestige-elevation') && original.url.includes('downtown-cosmetology-program.webp')) return [];
    const localUrl = LOCAL_SHOP_MEDIA[original.url];
    let item = localUrl ? { ...original, url: localUrl, source: original.source || original.url } : original;
    // First-party imports should use repository asset paths. Normalize them
    // before deduplication so an absolute URL and its repository path form one slide.
    try {
      const parsed = new URL(item.url, 'https://www.elevateforhumanity.org');
      // These verified Executivecutz imports are bundled locally. GitHub raw
      // URLs bypassed responsive optimization and added a third-party request.
      if (parsed.hostname === 'raw.githubusercontent.com' &&
          /^\/elevate-for-humanity\/Elevate-lms\/[^/]+\/public\/images\/host-shops\/executivecutz\/interior-[1-5]\.webp$/.test(parsed.pathname)) {
        item = { ...item, url: parsed.pathname.slice(parsed.pathname.indexOf('/public/') + 7) };
      }
      if (parsed.hostname === 'www.elevateforhumanity.org' || parsed.hostname === 'elevateforhumanity.org') {
        item = { ...item, url: parsed.pathname + parsed.search };
      }
    } catch { return []; }
    // The printed album sheets and contact card are source material, not
    // portfolio photography. Publish the restored manicure, with clear labeling.
    if (slug.startsWith('style-and-scissor')) {
      if (/\/(?:logo|contact-card|melissas-nails|pink-nail-work)\.webp$/.test(item.url)) return [];
      if (item.url === '/images/partners/style-and-scissor-salon/portfolio-nail-work.webp') item = {
        ...item,
        url: '/images/partners/style-and-scissor-salon/manicure-enhanced-2026.webp',
        alt: 'AI-enhanced manicure photograph restored from Style and Scissor Salon’s published nail portfolio',
        source: item.source || original.url,
      };
    }
    const aliases: Record<string, string> = {
      '/images/partners/salon-saloon/team-sign.webp': '/images/partners/salon-saloon/team-commercial-2026.webp',
      '/images/partners/generations-hair/highlighted-curls-home.webp': '/images/partners/generations-hair/premium-curls.jpg',
      '/images/partners/generations-hair/highlighted-curls-card.webp': '/images/partners/generations-hair/premium-curls.jpg',
    };
    if (aliases[item.url]) item = { ...item, url: aliases[item.url] };
    if (slug.startsWith('top-shelf-barber-lounge')) {
      item = { ...item, url: item.url.replace(/(top-shelf-(?:fade-profile|wave-and-beard|modern-fringe|textured-crop|precision-fade|fade-and-beard))(?:-enhanced-2026)?\.(?:jpg|webp)$/, '$1-enhanced-2026.webp') };
    }
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

/** Keep a dual-program shop's nail/salon portfolio off an unrelated program page. */
export function shopGalleryForProgram(
  slug: string,
  items: ShopMedia[],
  program: string,
): ShopMedia[] {
  return curateShopGallery(slug, items).filter((item) => {
    const path = item.url.toLowerCase();
    if (program === 'barber-apprenticeship') {
      return !/nail|manicure|esthetic|cosmetology|prestige-elevation\/official-portfolio/.test(
        path,
      );
    }
    if (program === 'cosmetology-apprenticeship')
      return !/nail|manicure|esthetic|program-barber-training/.test(path);
    if (program === 'nail-technician-apprenticeship') return /nail|manicure/.test(path);
    if (program === 'esthetician-apprenticeship') return /esthetic|skincare|facial/.test(path);
    return false;
  });
}

/** Portfolio media comes from the selected partner's public gallery, never from compliance uploads. */
export function hostShopPortfolioPhotos(slug: string, gallery: unknown): ShopMedia[] {
  if (!Array.isArray(gallery)) return [];
  const photos = gallery.filter((item): item is ShopMedia => {
    if (!item || typeof item.url !== 'string' || (item.kind && !['photo', 'image'].includes(item.kind))) return false;
    return (/^\/(?!\/)/.test(item.url) || /^https:\/\//.test(item.url)) && !/\.(?:mp4|webm|mov)(?:$|\?)/i.test(item.url);
  });
  return curateShopGallery(slug, photos);
}
