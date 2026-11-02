import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../public/embed.js', import.meta.url), 'utf8');
function launch({ page, present = true, readyState = 'complete' } = {}) {
  const created = [], listeners = {}, errors = [];
  function element(tag) {
    const node = { tag, style: {}, children: [], attributes: {}, textContent: '', parent: null,
      setAttribute(k, v) { this.attributes[k] = v; },
      replaceChildren(...children) { this.children = children; children.forEach(x => { x.parent = this; }); },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); },
      getAttribute(k) { return k === 'data-page' ? page : null; },
    };
    created.push(node);
    return node;
  }
  const container = element('div'), window = {};
  const document = { readyState, getElementById: () => present ? container : null,
    createElement: element, addEventListener: (type, cb) => { listeners[type] = cb; } };
  runInNewContext(source, { window, document, console: { error: (...args) => errors.push(args) } });
  return { container, window, listeners, errors, created };
}

test('default embed mounts the iframe before its load event and reveals it after loading', () => {
  const { container } = launch();
  const iframe = container.children.find(x => x.tag === 'iframe');
  assert.ok(iframe, 'iframe must be attached for the browser to start navigation');
  assert.equal(iframe.src, 'https://www.elevateforhumanity.org/programs');
  assert.equal(iframe.attributes.loading, 'lazy');
  assert.equal(iframe.style.display, 'block');
  assert.ok(container.children.some(x => x.textContent === 'Loading...'));
  iframe.onload();
  assert.equal(container.children.length, 1);
  assert.equal(container.children[0], iframe);
  assert.equal(iframe.style.display, 'block');
});

test('invalid page values render as text and never produce a navigable iframe', () => {
  const page = '<img src=x onerror=alert(1)>';
  const { container, created, errors } = launch({ page });
  assert.equal(created.some(x => x.tag === 'iframe'), false);
  assert.equal(container.children[0].textContent, `Error: Page "${page}" not available for embedding.`);
  assert.equal(container.children[0].innerHTML, undefined);
  assert.equal(errors.length, 1);
});

test('missing container is a no-op and the public initialization API remains available', () => {
  const { window, created } = launch({ present: false });
  assert.equal(created.some(x => x.tag === 'iframe'), false);
  assert.equal(typeof window.EFHEmbed.init, 'function');
  assert.ok(window.EFHEmbed.availablePages.includes('programs'));
});

test('a loading document waits for DOM readiness before mounting', () => {
  const { container, listeners } = launch({ readyState: 'loading', page: 'about' });
  assert.equal(container.children.length, 0);
  listeners.DOMContentLoaded();
  assert.equal(container.children.find(x => x.tag === 'iframe').src, 'https://www.elevateforhumanity.org/about');
});

test('iframe load failures replace loading content with the established error message', () => {
  const { container } = launch();
  container.children.find(x => x.tag === 'iframe').onerror();
  assert.match(container.innerHTML, /Failed to load content/);
});
