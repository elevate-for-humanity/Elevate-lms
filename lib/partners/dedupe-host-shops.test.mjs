import test from 'node:test';
import assert from 'node:assert/strict';
import { uniqueHostShops } from './dedupe-host-shops.mjs';
const shop = (name, slug, programs = ['barber-apprenticeship']) => ({ name, slug, programs, address: '120 E Market St, Suite 560' });
test('historical spelling and slug variants display as one business, retaining its pathways', () => {
  const shops = uniqueHostShops([shop('Cal’s Kutz Studio', 'old'), shop('Cals Kutz Studio', 'new', ['cosmetology-apprenticeship'])]);
  assert.equal(shops.length, 1);
  assert.deepEqual(shops[0].programs, ['barber-apprenticeship', 'cosmetology-apprenticeship']);
});
test('separate businesses sharing a location remain separate', () => {
  assert.equal(uniqueHostShops([shop('Mesmerized by Beauty', 'mesmerized'), shop('Prestige Elevation', 'prestige')]).length, 2);
});
test('absolute and local versions of the same business image produce one slide', () => {
  const first = {...shop('Salon Saloon LLC', 'salon-saloon'),gallery:[{url:'/images/partners/salon-saloon/team-sign.webp'}]};
  const second = {...shop('Salon Saloon', 'salon-saloon-old'),gallery:[{url:'https://www.elevateforhumanity.org/images/partners/salon-saloon/team-sign.webp'}]};
  assert.equal(uniqueHostShops([first, second])[0].gallery.length, 1);
});

test('independent approved profiles with similar names keep separate URLs and programs', () => {
  const legacy = shop('Example Studio', 'legacy');
  const approved = { ...shop('Example Salon', 'approved', ['cosmetology-apprenticeship']), matchByName: false };
  assert.deepEqual(uniqueHostShops([legacy, approved]).map(({ slug, programs }) => ({ slug, programs })), [
    { slug: 'legacy', programs: ['barber-apprenticeship'] },
    { slug: 'approved', programs: ['cosmetology-apprenticeship'] },
  ]);
});
