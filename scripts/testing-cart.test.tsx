import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import TestingCart, { AddExamToCartButton } from '../components/testing/TestingCart';
import { addToCart, getCart } from '../lib/store/cart';
import { ACTIVE_PROVIDERS } from '../lib/testing/proctoring-capabilities';
import { getPublicExamAmountCents } from '../lib/testing/exam-pricing';

test('approved prices agree for NHA string exams and reject unknown providers', () => {
  const nha = ACTIVE_PROVIDERS.find((provider) => provider.key === 'nha')!;
  assert.equal(getPublicExamAmountCents(nha, nha.exams[0]), 24900);
  assert.equal(getPublicExamAmountCents({ ...nha, key: 'unknown' }, nha.exams[0]), null);
  for (const provider of ACTIVE_PROVIDERS)
    for (const exam of provider.exams) {
      const price = getPublicExamAmountCents(provider, exam);
      assert.ok(price === null || (Number.isSafeInteger(price) && price > 0));
    }
});

test('adding an exam exposes its scheduling destination and clearing leaves merchandise intact', async () => {
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'https://www.elevateforhumanity.org/testing',
  });
  for (const [name, value] of Object.entries({
    window: dom.window,
    self: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    CustomEvent: dom.window.CustomEvent,
    HTMLElement: dom.window.HTMLElement,
  })) {
    Object.defineProperty(globalThis, name, { value, configurable: true });
  }
  Object.defineProperty(globalThis, 'React', { value: React, configurable: true });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    value: true,
    configurable: true,
  });
  dom.window.matchMedia = (() => ({ matches: true })) as typeof dom.window.matchMedia;
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  addToCart({
    id: 'book',
    slug: 'book',
    name: 'Book',
    category: 'certification-prep',
    price: 20,
    description: 'Study book',
    image: '',
    inStock: true,
    featured: false,
    digital: false,
  });
  const host = dom.window.document.getElementById('root')!;
  const root = createRoot(host);
  await act(async () =>
    root.render(
      <>
        <AddExamToCartButton
          examType="nha"
          examName="Certified Phlebotomy Technician (CPT)"
          amountCents={24900}
          active
        />
        <TestingCart />
      </>,
    ),
  );
  const add = host.querySelector('button')!;
  await act(async () => add.click());
  assert.match(host.textContent!, /1 exam/);
  assert.match(host.textContent!, /\$249\.00/);
  const schedule = [...host.querySelectorAll('a')].find((link) =>
    link.textContent?.includes('Choose date & checkout'),
  )!;
  const destination = new URL(schedule.href);
  assert.equal(destination.pathname, '/testing/checkout');
  assert.equal(destination.searchParams.get('provider'), 'nha');
  assert.equal(destination.searchParams.get('exam'), 'Certified Phlebotomy Technician (CPT)');
  assert.equal(dom.window.document.activeElement?.id, 'testing-cart');
  await act(async () => add.click());
  assert.equal(getCart().items.find((item) => item.product.id.startsWith('testing-'))?.quantity, 1);
  const clear = [...host.querySelectorAll('button')].find((button) =>
    button.textContent?.includes('Clear testing exams'),
  )!;
  await act(async () => clear.click());
  assert.match(host.textContent!, /0 exams/);
  assert.deepEqual(
    getCart().items.map((item) => item.product.id),
    ['book'],
  );
  await act(async () => root.unmount());
  dom.window.close();
});
