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
