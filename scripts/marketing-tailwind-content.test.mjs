import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { marketingTailwindContent } from './marketing-tailwind-content.mjs';

test('shared and lazy UI keeps its CSS without including unrelated portal styles', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'marketing-css-'));
  function write(filename, text) {
    const target = path.join(root, filename);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
  try {
    write(
      'apps/marketing/tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['../../*'] },
          moduleResolution: 'bundler',
          allowJs: true,
          jsx: 'preserve',
        },
      }),
    );
    write(
      'apps/marketing/app/page.tsx',
      `
      import { Header } from '@/components/public';
      import type { Editor } from '@/components/private/editor';
      const Lazy = () => import('@/components/public/lazy');
      const Legacy = require('@/components/public/legacy');
      export default () => <main className="grid-cols-3"><Header /></main>;
    `,
    );
    write('components/public/index.ts', `export { Header } from './header';`);
    write(
      'components/public/header.tsx',
      `import './index'; export const Header = () => <nav className="md:flex text-brand-public" />;`,
    );
    write('components/public/lazy.tsx', `export default () => <div className="lg:grid-cols-4" />;`);
    write('components/public/legacy.js', `export const style = 'hover:bg-emerald-700';`);
    write(
      'components/private/editor.tsx',
      `export const Editor = () => <div className="w-[9876px]" />;`,
    );
    write('apps/marketing/app/page.test.tsx', `const testOnly = 'h-[9876px]';`);
    write('apps/admin/app/page.tsx', `export default () => <div className="z-[9876]" />;`);
    const files = marketingTailwindContent({ root });
    assert.equal(files.length, 5, 'page, barrel, shared header, lazy UI and require target');
    assert.ok(files.every(path.isAbsolute));
    assert.ok(!files.some((filename) => /private|admin|\.test\./.test(filename)));
    const result = await postcss([
      tailwind({
        content: files,
        theme: { extend: { colors: { 'brand-public': '#123456' } } },
        corePlugins: { preflight: false },
      }),
    ]).process('@tailwind utilities;', { from: undefined });
    for (const selector of [
      '.grid-cols-3',
      '.md\\:flex',
      '.lg\\:grid-cols-4',
      '.text-brand-public',
      '.hover\\:bg-emerald-700',
    ]) {
      assert.ok(result.css.includes(selector), `required public selector: ${selector}`);
    }
    assert.ok(!result.css.includes('9876'), 'private, test and unrelated app CSS is absent');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('real marketing graph retains shared navigation, hero and content sources from any cwd', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const files = marketingTailwindContent();
  for (const filename of [
    'apps/marketing/app/layout.tsx',
    'apps/marketing/app/page.tsx',
    'components/home/PlatformHubHero.tsx',
    'components/site/Header.tsx',
    'components/pwa/MarketingPwaClient.tsx',
  ])
    assert.ok(files.includes(path.join(root, filename)), filename);
  assert.ok(files.some((filename) => filename.includes('/content/')));
  assert.ok(!files.some((filename) => filename.includes('/apps/admin/')));
  assert.ok(!files.some((filename) => filename.includes('/node_modules/')));
});
