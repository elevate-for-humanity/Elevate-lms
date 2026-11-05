import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('./smoke-marketing-container.mjs',import.meta.url),'utf8');

test('Store smoke never eagerly loads the Marketing-only Cheerio parser',()=>{
  assert.doesNotMatch(source,/^import\s+.*homepage-content\.mjs/m);
  const marketing=source.indexOf("if (component === 'marketing')");
  const store=source.indexOf("if (component === 'store')");
  const imported=source.indexOf("await import('./homepage-content.mjs')");
  assert.ok(marketing>=0 && imported>marketing && store>imported,
    'Marketing-only HTML parsing must happen inside its Marketing branch');
});
test('container smoke still verifies Store pages and exact image identity',()=>{
  assert.match(source,/assertStorePageChrome\(html, path\)/);
  assert.match(source,/assert\.equal\(identity\.commitSha, sha\)/);
  assert.match(source,/const image = `elevate-\$\{component\}:\$\{sha\}`/);
});
