import { expect, it } from 'vitest';
import { workbookProducts, workbookAccessHref } from '@/lib/store/workbook-products';
import { resolveCartAddParam } from '@/lib/store/resolve-cart-add';
it('connects all four existing workbooks to the correct $90 cart product and account resource', () => {
  expect(workbookProducts).toHaveLength(4);
  for (const book of workbookProducts) {
    expect(resolveCartAddParam(book.slug)).toMatchObject({ id: book.id, price: 90, digital: true, inStock: true });
    expect(workbookAccessHref(book.id)).toBe(`https://app.elevateforhumanity.org/workbooks/${book.workbookSlug}`);
  }
  expect(workbookAccessHref('unrelated-product')).toBeNull();
});
