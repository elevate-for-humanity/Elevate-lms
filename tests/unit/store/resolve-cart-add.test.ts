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

// The managed platform licenses and community add-ons had the same class
// of breakage: their slugs live in the canonical catalog
// (lib/data/store-products) but the resolver never consulted it, so
// /store/cart?add=<slug> returned null and the cart showed "That product
// could not be added." The school license detail page was doubly broken —
// its "Purchase Now" linked to /store/checkout?license=school, a param
// the cart page never reads. These must resolve at the advertised prices
// (which the 20261123 price-correction migrations also set in the DB).
describe('resolveCartAddParam — platform licenses and community add-ons', () => {
  it('resolves school-license at the advertised $15,000 one-time price', () => {
    expect(resolveCartAddParam('school-license')).toMatchObject({
      slug: 'school-license',
      name: 'School / Training Provider License',
      price: 15000,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('resolves efh-core-platform at the advertised $4,999 price', () => {
    expect(resolveCartAddParam('efh-core-platform')).toMatchObject({
      slug: 'efh-core-platform',
      name: 'EFH Core Workforce Platform',
      price: 4999,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('resolves enterprise-license at the advertised $50,000 price', () => {
    expect(resolveCartAddParam('enterprise-license')).toMatchObject({
      slug: 'enterprise-license',
      name: 'Enterprise Workforce Solution',
      price: 50000,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('resolves monthly-subscription at the advertised $499/month price', () => {
    expect(resolveCartAddParam('monthly-subscription')).toMatchObject({
      slug: 'monthly-subscription',
      name: 'Monthly Subscription',
      price: 499,
      category: 'license',
      digital: true,
      inStock: true,
    });
  });

  it('resolves community add-ons at the advertised prices', () => {
    expect(resolveCartAddParam('community-hub')).toMatchObject({
      slug: 'community-hub',
      price: 2499,
      category: 'license',
    });
    expect(resolveCartAddParam('community-basic')).toMatchObject({
      slug: 'community-basic',
      price: 99,
      category: 'license',
    });
    expect(resolveCartAddParam('community-pro')).toMatchObject({
      slug: 'community-pro',
      price: 199,
      category: 'license',
    });
    expect(resolveCartAddParam('community-enterprise')).toMatchObject({
      slug: 'community-enterprise',
      price: 299,
      category: 'license',
    });
  });

  it('does not resolve grant add-ons, which have no DB row or purchase path', () => {
    expect(resolveCartAddParam('grant-contract-automation-suite')).toBeNull();
    expect(resolveCartAddParam('agency-template-autofill')).toBeNull();
  });
});
