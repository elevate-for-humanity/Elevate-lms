import { load } from 'cheerio';
import assert from 'node:assert/strict';
/** Read page content, excluding scripts and treating discretionary hyphens as layout. */
export function normalizeHomepageText(html) {
  const page = load(html);
  page('script,style,template').remove();
  return page.root().text().replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim();
}

/** Validate the rendered, named Host Shop region rather than serialized React data. */
export function assertHomepageHostShopContract(html) {
  const page = load(html);
  page('script,style,template').remove();
  const section = page('section#barber-beauty-network');
  assert.equal(section.length, 1, 'Homepage must render one combined Barber & Beauty section');
  const headingId = section.attr('aria-labelledby');
  const heading = section.find('h2').filter((_, node) => page(node).attr('id') === headingId);
  assert.equal(heading.length, 1, 'Host Shop region must reference its own visible heading');
  assert.equal(heading.text().replace(/\s+/g, ' ').trim(), 'Barber & Beauty Apprenticeships');
  assert.ok(section.is('[data-scroll-narration]'), 'Host Shop region must participate in page narration');
  assert.match(section.attr('data-narration') || '', /licensed supervision/);
  assert.equal(section.attr('data-narration-style'), 'instructor');
  assert.ok(section.find('a[href="/partners/host-shops"]').length, 'Host Shop join path must remain available');
  assert.ok(section.find('a[href="/barber-and-beauty-apprenticeships"]').length, 'Beauty program discovery must remain available');
  const shops = section.find('[data-featured-shops] [data-featured-shop]');
  assert.ok(shops.length > 0, 'Actual featured Host Shop cards must be rendered');
  shops.each((_, node) => {
    const shop = page(node);
    assert.ok(shop.find('a[href^="/host-shops/"]').length, 'Featured shop must have a profile link');
    const photo = shop.find('img').first();
    const alt = photo.attr('alt') || '';
    assert.ok(photo.attr('src'), 'Featured shop photograph must have a source');
    assert.ok(alt.trim().length > 10 && !alt.includes('PLATFORM_DEFAULTS'), 'Featured shop photograph must have human-readable alternative text');
  });
}
