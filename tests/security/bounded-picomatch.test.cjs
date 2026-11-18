const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');

for (const major of [2, 4]) {
  const location = require.resolve(`../../packages/bounded-picomatch-${major}`);
  const picomatch = require(location);

  test(`picomatch ${major}: repeated wildcard regressions finish in a bounded subprocess`, () => {
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const pm = require(${JSON.stringify(location)});
      for (const pattern of ['+(*)', '+(*a)', '*(a*)', '+(@(*a))', '+(*a|b)', '+([[a]*a)', '+([[]*a)', '+([*a)', '+([[:alpha:]]*a)', '+([[:alpha:]*a])', '+([[:foo:]*a])', 'prefix/+(*a).js']) {
        for (const options of [{}, {capture:true}, {windows:true}, {maxExtglobRecursion:false}, {nobracket:true}, {bash:true}, {unescape:true}, {literalBrackets:true}, {fastpaths:false}, {posix:false}]) {
          const matcher = pm(pattern, options);
          assert.equal(matcher('a'.repeat(10000) + '!'), false);
          assert.equal(matcher(pattern), true);
          const state = pm.parse(pattern, options);
          assert.equal(pm.compileRe(state, options).test('a'.repeat(10000) + '!'), false);
          assert.equal(pm.makeRe(pattern, options).test('a'.repeat(10000) + '!'), false);
        }
      }
    `], { timeout: 3000, encoding: 'utf8' });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
  });

  test(`picomatch ${major}: malformed POSIX tokens and posix:false are bounded on reported payload`, () => {
    const result = spawnSync(process.execPath, ['-e', `
      const assert = require('node:assert/strict');
      const pm = require(${JSON.stringify(location)});
      const attack = 'fa]'.repeat(40) + '!';
      for (const pattern of ['+([[:foo:]*a])', '+([[:alpha:]*a])']) {
        for (const options of [{}, {posix:false}]) {
          assert.equal(pm(pattern, options)(attack), false);
          assert.equal(pm.makeRe(pattern, options).test(attack), false);
          assert.equal(pm.compileRe(pm.parse(pattern, options), options).test(attack), false);
        }
      }
    `], { timeout: 1800, encoding: 'utf8' });
    assert.equal(result.error, undefined, result.stderr);
    assert.equal(result.status, 0, result.stderr);
  });

  test(`picomatch ${major}: ordinary globs and literal stars retain their meaning`, () => {
    for (const [pattern, yes, no] of [
      ['src/**/*.js', 'src/nested/app.js', 'src/app.ts'],
      ['*.{js,ts}', 'app.ts', 'app.css'],
      ['+(a|b)', 'abba', 'abc'],
      ['+(ab)', 'abab', 'aba'],
      ['+([*])', '***', 'abc'],
      ['+([[:alpha:]*])', 'a*a', '123'],
      ['+(\\*)', '***', 'abc'],
      ['+("*")', '***', 'abc'],
      ['!(*.test).js', 'app.js', 'app.test.js'],
    ]) {
      assert.equal(picomatch(pattern)(yes), true, pattern);
      assert.equal(picomatch(pattern)(no), false, pattern);
    }
    assert.equal(picomatch('+(*)', {noext:true})('+(*)'), true);
    assert.equal(picomatch.scan('src/**/*.js').isGlob, true);
  });
}

test('installed consumers resolve the maintained forks and match normal files', () => {
  const nextRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
  const globRequire = createRequire(nextRequire.resolve('fast-glob'));
  const matchRequire = createRequire(globRequire.resolve('micromatch'));
  assert.equal(matchRequire('picomatch/package.json').name, '@elevate/bounded-picomatch-2');
  assert.deepEqual(globRequire('micromatch')(['a.ts','a.js','a.css'], '*.{ts,js}'), ['a.ts','a.js']);
  assert.ok(nextRequire('fast-glob').sync('packages/bounded-picomatch-*/index.js').length === 2);
  const viteRequire = createRequire(require.resolve('vite'));
  assert.equal(viteRequire('picomatch/package.json').name, '@elevate/bounded-picomatch-4');
  assert.equal(viteRequire('picomatch')('src/**/*.js')('src/app.js'), true);
  for (const resolve of [matchRequire, viteRequire]) {
    assert.equal(resolve('picomatch')('+(*a)')('a'.repeat(40) + '!'), false);
  }
});
