import { load } from 'cheerio';
/** Read page content, excluding scripts and treating discretionary hyphens as layout. */
export function normalizeHomepageText(html) {
  const page = load(html);
  page('script,style,template').remove();
  return page.root().text().replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim();
}
