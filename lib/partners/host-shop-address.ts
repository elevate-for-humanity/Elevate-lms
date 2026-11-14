export function parseHostShopAddress(raw: string): { address: string; city: string; state: string; zip: string } {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return { address: raw.trim(), city: '', state: 'IN', zip: '' };
  const stateZipPart = parts.at(-1) ?? '';
  const separateZip = /^\d{5}(?:-\d{4})?$/.test(stateZipPart);
  const stateIndex = parts.length - (separateZip ? 2 : 1);
  const stateZipMatch = (parts[stateIndex] ?? '').match(/^(IN|Indiana)(?:\s+(\d{5}(?:-\d{4})?))?$/i);
  if (stateZipMatch && stateIndex >= 2) {
    return {
      address: parts.slice(0, stateIndex - 1).join(', '),
      city: parts[stateIndex - 1],
      state: 'IN',
      zip: separateZip ? stateZipPart : stateZipMatch[2] ?? '',
    };
  }
  return { address: parts.slice(0, -1).join(', '), city: parts.at(-1) ?? '', state: 'IN', zip: '' };
}

export type HostShopAddress = { address: string; city?: string; state?: string; zip?: string };

/** Strip an already-present location suffix; never persist changes to source records. */
export function normalizeHostShopAddress(shop: HostShopAddress): { address: string; city: string; state: string; zip: string } {
  let address = shop.address.trim();
  const parsed = parseHostShopAddress(address);
  const hasLocation = /,\s*(?:IN|Indiana)(?:\s|,|$)/i.test(address);
  const city = shop.city?.trim() || (hasLocation ? parsed.city : '');
  const state = (shop.state?.trim() || (hasLocation ? parsed.state : '')).replace(/^Indiana$/i, 'IN');
  const zip = shop.zip?.trim() || (hasLocation ? parsed.zip : '');
  if (city && state) {
    const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const states = state === 'IN' ? '(?:IN|Indiana)' : escape(state);
    const suffix = new RegExp(',\\s*' + escape(city) + ',\\s*' + states + '(?:(?:,\\s*|\\s+)\\d{5}(?:-\\d{4})?)?\\s*$', 'i');
    let previous: string;
    do { previous = address; address = address.replace(suffix, '').trim(); } while (address !== previous);
  }
  return { address, city, state, zip };
}

export function formatHostShopAddress(shop: HostShopAddress): string {
  const location = normalizeHostShopAddress(shop);
  return [location.address, location.city, location.state, location.zip].filter(Boolean).join(', ');
}
