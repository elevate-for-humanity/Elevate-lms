// Business identity, never a shared street address, determines duplicate listings.
export function hostShopBusinessKey(name) {
  return String(name || '').toLowerCase().replace(/&/g, ' and ')
    .replace(/\b(llc|inc|dba|studio|salon|barbershop|barber|shop|and|co)\b/g, '')
    .replace(/[^a-z0-9]/g, '').replace('scissors', 'scissor');
}
export function uniqueHostShops(shops) {
  const result = [];
  for (const shop of shops) {
    const key = hostShopBusinessKey(shop.name);
    const match = result.findIndex(row => row.slug === shop.slug || (key && hostShopBusinessKey(row.name) === key));
    if (match < 0) { result.push({ ...shop }); continue; }
    const previous = result[match];
    const gallery = new Map([...(previous.gallery || []), ...(shop.gallery || [])].map(item => [new URL(item.url, 'https://www.elevateforhumanity.org').pathname, item]));
    result[match] = { ...previous,
      programs: [...new Set([...previous.programs, ...shop.programs])],
      primaryProgram: previous.primaryProgram || shop.primaryProgram,
      description: previous.programs.length ? previous.description : shop.description,
      address: previous.address || shop.address,
      phone: previous.phone || shop.phone,
      website: previous.website || shop.website,
      booking: previous.booking || shop.booking,
      social: previous.social || shop.social,
      gallery: [...gallery.values()],
    };
  }
  return result;
}
