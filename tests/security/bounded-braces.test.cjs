const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const braces = require('../../packages/bounded-braces');
const deep = '{'.repeat(4000) + 'x' + '}'.repeat(4000);
const isBounded = (error) => error instanceof SyntaxError && error.code === 'BRACES_MAX_DEPTH';

for (const method of ['parse', 'compile', 'expand', 'stringify', 'create']) {
  test(`${method} rejects the reported deep pattern before stack exhaustion`, () => {
    assert.throws(() => braces[method](deep), isBounded);
    assert.throws(() => braces[method](deep, { maxDepth: Infinity }), isBounded);
  });
}
test('default, expansion, arrays and parenthesis nesting are bounded', () => {
  assert.throws(() => braces(deep), isBounded);
  assert.throws(() => braces([deep], { expand: true }), isBounded);
  assert.throws(() => braces('('.repeat(4000) + 'x' + ')'.repeat(4000)), isBounded);
});
for (const method of ['compile', 'expand', 'stringify']) {
  test(`${method} bounds direct AST input and rejects cycles`, () => {
    let ast = { type: 'text', value: 'x' };
    for (let i = 0; i < 4000; i++) ast = { type: 'root', nodes: [ast] };
    assert.throws(() => braces[method](ast), isBounded);
    const cyclic = { type: 'root', nodes: [] }; cyclic.nodes.push(cyclic);
    assert.throws(() => braces[method](cyclic), /Cyclic/);
  });
}
test('ordinary nested alternatives, ranges, escaping and glob compilation stay compatible', () => {
  assert.deepEqual(braces.expand('src/{a,{b,c}}/{01..03}.ts'), [
    'src/a/01.ts','src/a/02.ts','src/a/03.ts',
    'src/b/01.ts','src/b/02.ts','src/b/03.ts',
    'src/c/01.ts','src/c/02.ts','src/c/03.ts',
  ]);
  assert.equal(braces.compile('src/*.{js,ts}'), 'src/*.(js|ts)');
  assert.deepEqual(braces.expand('a/\\{b,c\\}'), ['a/{b,c}']);
  assert.deepEqual(braces.expand('{a,a,b}', { nodupes: true }), ['a','b']);
  assert.equal(braces.stringify(braces.parse('a/{b,c}')), 'a/{b,c}');
  assert.doesNotThrow(() => braces('{'.repeat(40)+'x'+'}'.repeat(40)));
});
test('installed glob consumers resolve the bounded implementation', () => {
  const nextRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
  const globRequire = createRequire(nextRequire.resolve('fast-glob'));
  const matchRequire = createRequire(globRequire.resolve('micromatch'));
  const installed = matchRequire('braces');
  assert.equal(matchRequire('braces/package.json').name, '@elevate/bounded-braces');
  assert.throws(() => installed(deep), isBounded);
  const micromatch = globRequire('micromatch');
  assert.deepEqual(micromatch(['a.ts','a.js','a.css'], '*.{ts,js}'), ['a.ts','a.js']);
  const glob = nextRequire('fast-glob');
  assert.ok(glob.sync('lib/phone/*.{ts,tsx}').includes('lib/phone/call-flow.ts'));
  const tailwindRequire = createRequire(require.resolve('tailwindcss'));
  const watcherRequire = createRequire(tailwindRequire.resolve('chokidar'));
  assert.equal(watcherRequire('braces/package.json').name, '@elevate/bounded-braces');
});
