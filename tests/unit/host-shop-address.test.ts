import { describe, expect, it } from 'vitest';
import { parseHostShopAddress } from '../../lib/partners/host-shop-address';

describe('host shop public addresses', () => {
  it.each([
    ['1828 E Main St, Plainfield, Indiana, 46168', '1828 E Main St', 'Plainfield', '46168'],
    ['1020 Gemini Ln, West Lafayette, Indiana, 47906', '1020 Gemini Ln', 'West Lafayette', '47906'],
    [
      '1740 S Bend Ave, Suite A, South Bend, IN 46637',
      '1740 S Bend Ave, Suite A',
      'South Bend',
      '46637',
    ],
    ['708 Adams St, Suite 102, Carmel, IN, 46032', '708 Adams St, Suite 102', 'Carmel', '46032'],
  ])('parses %s without turning ZIP codes into cities', (raw, address, city, zip) => {
    expect(parseHostShopAddress(raw)).toEqual({ address, city, state: 'IN', zip });
  });
  it('preserves incomplete addresses without inventing a city', () => {
    expect(parseHostShopAddress('1828 E Main St')).toEqual({
      address: '1828 E Main St',
      city: '',
      state: 'IN',
      zip: '',
    });
  });
});

import { formatHostShopAddress, normalizeHostShopAddress } from '@/lib/partners/host-shop-address';
it.each([
  '1600 E Bristol St',
  '1600 E Bristol St, Elkhart, IN 46514',
  '1600 E Bristol St, Elkhart, IN, 46514',
  '1600 E Bristol St, Elkhart, Indiana, 46514, Elkhart, IN, 46514',
])('normalizes duplicated location suffixes without altering records: %s', address => {
  const record = { address, city: 'Elkhart', state: 'IN', zip: '46514' };
  expect(normalizeHostShopAddress(record)).toEqual({ ...record, address: '1600 E Bristol St' });
  expect(formatHostShopAddress(record)).toBe('1600 E Bristol St, Elkhart, IN, 46514');
  expect(record.address).toBe(address);
});
it('keeps suite details and does not mistake a street name for the city suffix', () => {
  expect(formatHostShopAddress({ address: '12 Indianapolis Ave, Suite 4', city: 'Indianapolis', state: 'Indiana', zip: '46204' })).toBe('12 Indianapolis Ave, Suite 4, Indianapolis, IN, 46204');
});
