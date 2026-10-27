import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsxFindings } from './jsx-findings.mjs';
const audit = source => jsxFindings(source, 'sample.tsx', 'shared').map(h => h.id);
test('detects missing responsive image sizes in either prop order', () => {
  assert.deepEqual(audit('<Image src={items.map(x => x.url)[0]} fill />'), ['fill-no-sizes']);
  assert.deepEqual(audit('<Image sizes="100vw" src={items.map(x => x.url)[0]} fill />'), []);
  assert.deepEqual(audit('<Image fill sizes="100vw" />'), []);
});
test('detects opaque light surface contrast regardless of class order', () => {
  assert.deepEqual(audit('<p className="text-slate-400 bg-white">Text</p>'), ['low-contrast-neutral-on-light']);
  assert.deepEqual(audit('<p className="bg-white text-white">Text</p>'), ['invisible-white-on-white']);
});
test('does not conflate translucent, hover, placeholder or descendant colors', () => {
  assert.deepEqual(audit('<><p className="bg-white/10 text-slate-300"/><button className="hover:bg-white text-slate-400"/><input className="bg-white text-slate-950 placeholder:text-slate-400"/><div className="bg-white"><span className="bg-black text-white"/></div></>'), []);
});
test('full preload is a usage finding, not a prop type declaration', () => {
  assert.deepEqual(audit('interface Props { preloadFull?: boolean; }'), []);
  assert.deepEqual(audit('<UltraVideoPlayer preloadFull />'), ['preload-full-hero']);
  assert.deepEqual(audit('<UltraVideoPlayer preloadFull={false} />'), []);
});
