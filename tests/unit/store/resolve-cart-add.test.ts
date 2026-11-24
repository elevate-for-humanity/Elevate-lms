import { describe, expect, it } from 'vitest';

import { resolveCartAddParam } from '@/lib/store/resolve-cart-add';

// Regression test for the broken store checkout: the "Purchase Now" buttons
// on the Starter ($299) and Pro ($999) license pages link to
// /store/licenses/checkout/<slug>, which redirects to /store/cart?add=<slug>.
// resolveCartAddParam must resolve those slugs from the canonical clone
// license catalog, otherwise the cart shows "That product could not be
// added." and stays empty.
describe('resolveCartAddParam — clone licenses', () => {
  it('resolves starter-license at the advertised $299 price', () => {
    const product = resolveCartAddParam('starter-license');
    expect(product).toMatchObject({
      slug: 'starter-license',
      name: 'Elevate LMS Starter License',
      price: 299,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('resolves pro-license at the advertised $999 price', () => {
    const product = resolveCartAddParam('pro-license');
    expect(product).toMatchObject({
      slug: 'pro-license',
      name: 'Elevate LMS Pro License',
      price: 999,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('resolves enterprise-clone-license at the advertised $5,000 price', () => {
    const product = resolveCartAddParam('enterprise-clone-license');
    expect(product).toMatchObject({
      slug: 'enterprise-clone-license',
      name: 'Elevate LMS Enterprise License',
      price: 5000,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('is case- and whitespace-insensitive for license slugs', () => {
    expect(resolveCartAddParam('  Starter-License ')).toMatchObject({
      slug: 'starter-license',
      price: 299,
    });
  });

  it('still returns null for unknown slugs', () => {
    expect(resolveCartAddParam('not-a-real-product')).toBeNull();
    expect(resolveCartAddParam('')).toBeNull();
  });

  it('still resolves the HVAC bundle and workbook products', () => {
    expect(resolveCartAddParam('hvac-epa608-guided-practice-workbook')).toMatchObject({
      slug: 'hvac-epa608-guided-practice-workbook',
    });
    expect(resolveCartAddParam('barber-apprenticeship-workbook')).toMatchObject({
      slug: 'barber-apprenticeship-workbook',
    });
  });
});
