import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const playwright = require('playwright');
const version = require('playwright/package.json').version;
const browsers = process.argv.slice(2);
if (!browsers.length) throw new Error('Specify the browsers required by this CI job.');
for (const name of browsers) {
  if (!['chromium', 'firefox', 'webkit'].includes(name)) throw new Error(`Unsupported browser: ${name}`);
  if (!existsSync(playwright[name].executablePath())) {
    throw new Error(`Preinstalled ${name} is missing for Playwright ${version}. Use the matching official Playwright image; do not skip browser validation.`);
  }
  console.log(`Preinstalled Playwright ${version}: ${name} executable verified`);
}
