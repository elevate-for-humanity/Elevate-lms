import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postcss from 'postcss';

export const cssChunkCount = 4;
export const cssChunkBudget = 100_000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Split only BETWEEN complete top-level rules, retaining exact cascade order. */
export function partitionMarketingCss(css, budget = cssChunkBudget) {
  const chunks = [''];
  for (const node of postcss.parse(css).nodes) {
    const rule = node.toString();
    if (Buffer.byteLength(rule) > budget)
      throw new Error('One CSS rule exceeds the Marketing CSS budget');
    if (Buffer.byteLength(chunks.at(-1) + rule) > budget) chunks.push('');
    chunks[chunks.length - 1] += rule;
  }
  return chunks;
}

export function buildMarketingCss() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'marketing-css-build-'));
  try {
    const output = path.join(temporary, 'marketing.css');
    const compiled = spawnSync(
      process.execPath,
      [
        path.join(root, 'node_modules/tailwindcss/lib/cli.js'),
        '-c',
        'tailwind.config.js',
        '-i',
        'app/globals.css',
        '-o',
        output,
        '--minify',
      ],
      { cwd: path.join(root, 'apps/marketing'), stdio: 'inherit' },
    );
    if (compiled.status !== 0) throw new Error('Marketing CSS compilation failed');
    const chunks = partitionMarketingCss(fs.readFileSync(output, 'utf8'));
    if (chunks.length > cssChunkCount)
      throw new Error('Marketing CSS exceeds its total chunk budget; remove unused styles');
    const directory = path.join(root, 'apps/marketing/app/generated-css');
    fs.mkdirSync(directory, { recursive: true });
    const sizes = [];
    for (let index = 0; index < cssChunkCount; index++) {
      const filename = path.join(directory, `marketing-${index}.css`);
      const content = chunks[index] || '/* Reserved Marketing CSS chunk. */';
      fs.writeFileSync(`${filename}.tmp`, content);
      fs.renameSync(`${filename}.tmp`, filename);
      sizes.push(Buffer.byteLength(content));
    }
    console.log(
      JSON.stringify({
        marketingCssBytes: sizes.reduce((a, b) => a + b, 0),
        chunkBytes: sizes,
        budget: cssChunkBudget,
      }),
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export function verifyMarketingCss(directory = path.join(root, 'apps/marketing/.next/static/css')) {
  const files = fs.readdirSync(directory).filter((filename) => filename.endsWith('.css'));
  if (!files.length) throw new Error('Production Marketing CSS is missing');
  const sizes = files.map((filename) => ({
    filename,
    bytes: fs.statSync(path.join(directory, filename)).size,
  }));
  if (sizes.some((file) => file.bytes > 150_000))
    throw new Error(`Production CSS exceeds 150 KB: ${JSON.stringify(sizes)}`);
  console.log(JSON.stringify({ productionCss: sizes, allUnder150KB: true }));
  return sizes;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--verify')) verifyMarketingCss();
  else buildMarketingCss();
}
