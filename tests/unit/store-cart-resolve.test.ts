import { describe, expect, it } from 'vitest';
import {
  isIndividualAppCartProduct,
  parseIndividualAppCartProduct,
  resolveCartAddParam,
} from '@/lib/store/resolve-cart-add';

describe('resolveCartAddParam', () => {
  it('resolves individual app shorthand add links', () => {
    const product = resolveCartAddParam('website-builder-pro');
    expect(product).not.toBeNull();
    expect(product?.name).toContain('Website Builder');
    expect(product?.price).toBe(79);
    expect(product?.id).toBe('individual:website-builder:professional');
  });

  it('resolves workbook slugs from catalog', () => {
    const product = resolveCartAddParam('hvac-technician-workbook');
    expect(product?.slug).toBe('hvac-technician-workbook');
  });

  it('parses individual cart product ids', () => {
    expect(isIndividualAppCartProduct('individual:grants:starter')).toBe(true);
    expect(parseIndividualAppCartProduct('individual:grants:starter')).toEqual({
      appSlug: 'grants',
      planId: 'starter',
    });
  });
});
