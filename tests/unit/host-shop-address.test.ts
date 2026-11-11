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
