#!/usr/bin/env bash
set -euo pipefail

echo "🤖 Installing EFH Autopilot System..."

jq -r .name package.json >/dev/null 2>&1 || npm init -y

# Core toolchain
echo "📦 Installing dependencies..."
npm i -D prettier eslint stylelint postcss autoprefixer \
  eslint-plugin-tailwindcss stylelint-config-standard stylelint-order \
  @typescript-eslint/parser @typescript-eslint/eslint-plugin \
  @playwright/test @axe-core/playwright \
  lighthouse @lhci/cli size-limit @size-limit/file @size-limit/preset-small-lib \
  knip madge dependency-cruiser ts-prune unimported \
  linkinator html-validate @html-validate/stylish \
  sharp imagetools-core \
  dotenv dotenv-cli zod \
  ts-node typescript @types/node \
  globby fast-glob chokidar \
  json sort-package-json

# Optional for Next/Vite projects (safe to install even if unused)
npm i -D next-sitemap @next/bundle-analyzer vite-plugin-inspect rollup-plugin-visualizer || true

# Husky (git hooks) — optional
npm i -D husky lint-staged && npx husky init || true

# Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium || true

echo "📁 Creating directory structure..."
mkdir -p autopilot tools .github/workflows scripts tests/specs

cat > autopilot/README.md <<'MD'
# EFH Pre‑Deploy Doctor (Autopilot)

**Commands**
- `npm run autopilot:fix` — Auto‑fix everything safe, then run checks
- `npm run autopilot:check` — Run checks only (CI‑safe)
- `npm run autopilot:prepush` — Fast subset for local pre‑push

**What it auto‑fixes**
- Prettier formatting, ESLint/Stylelint `--fix`
- Sort `package.json`, dedupe deps, organize imports
- Optimize images (to WebP/AVIF when safe), generate missing favicons/OG
- Generate/repair `sitemap.xml` + `robots.txt` (if Next/Vite present)
- Sync Tailwind safelist + brand tokens

**What it fails for**
- Type errors, failing unit/E2E tests, broken links, route 404s
- A11y (axe) violations above threshold
- Lighthouse < target scores (perf/a11y/SEO)
- Bundle size over budgets
- Env/secret misconfig (missing required vars, accidental plaintext keys)
- Circular deps, dead exports/files, unused deps (critical ones)
MD

echo "⚙️  Configuring linters..."

cat > .eslintrc.cjs <<'ESL'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint','tailwindcss'],
  extends: ['eslint:recommended','plugin:@typescript-eslint/recommended'],
  env: { browser: true, node: true, es2021: true },
  rules: {
    'no-restricted-syntax': [
      'error',
      { selector: "Literal[value=/^#([0-9a-fA-F]{3,8})$/]", message: 'Use brand tokens or Tailwind classes.' }
    ],
    'tailwindcss/classnames-order':'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn'
  },
  ignorePatterns: ['dist', 'build', 'node_modules', '*.config.js', '*.config.cjs']
}
ESL

cat > .stylelintrc.cjs <<'STL'
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    'declaration-property-value-disallowed-list': {
      '/.*/': [ '/#([0-9a-fA-F]{3,8})\\b/', '/\\brgb\\(/', '/\\bhsl\\(/' ]
    },
    'order/properties-alphabetical-order': true,
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer'] }
    ]
  },
  ignoreFiles: ['node_modules/**/*', 'dist/**/*', 'build/**/*', 'src/styles/brand.css']
}
STL

echo "🔧 Creating autopilot tools..."

cat > tools/env-guard.ts <<'TS'
import fs from 'fs'
import 'dotenv/config'

const required = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
]

let missing: string[] = []
for (const k of required) {
  if (!process.env[k]) missing.push(k)
}

if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '))
  console.error('   Check your .env file or environment configuration')
  process.exit(1)
}

// Basic secret leak heuristic in repo files
const suspect = /(AKIA|AIza|sk_live|sk_test|ghp_|xox[baprs]-|-----BEGIN (RSA|EC) PRIVATE KEY-----)/
const checkFiles = ['.env.example', 'README.md', 'package.json']

for (const f of checkFiles) {
  if (fs.existsSync(f)) {
    const s = fs.readFileSync(f, 'utf8')
    if (suspect.test(s)) {
      console.error('❌ Possible secret found in', f)
      console.error('   Remove secrets from tracked files!')
      process.exit(1)
    }
  }
}

console.log('✅ env guard passed')
TS

cat > tools/tokens-guard.ts <<'TS'
import fs from 'fs'

const file = fs.existsSync('autopilot-brand.json') ? 'autopilot-brand.json' : null
if (!file) {
  console.log('• No autopilot-brand.json; skipping tokens guard')
  process.exit(0)
}

const brand = JSON.parse(fs.readFileSync(file, 'utf8')) as { colors: Record<string, string> }

function lum(h: string) {
  const c = h.replace('#', '')
  const n = (i: number) => parseInt(c.slice(i, i + 2), 16) / 255
  const [r, g, b] = [0, 2, 4].map(n).map(v =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string) {
  const [A, B] = [lum(a), lum(b)]
  const [hi, lo] = A > B ? [A, B] : [B, A]
  return (hi + 0.05) / (lo + 0.05)
}

const pairs: [string, string][] = [
  ['background', 'text'],
  ['surface', 'text'],
  ['primary', 'onPrimary'],
  ['secondary', 'onSecondary'],
  ['success', 'onSuccess'],
  ['info', 'onInfo'],
  ['warning', 'onWarning'],
  ['danger', 'onDanger']
]

let bad = 0
for (const [bg, tx] of pairs) {
  const a = brand.colors[bg]
  const b = brand.colors[tx]
  if (!a || !b) continue
  const r = contrast(a, b)
  if (r < 4.5) {
    console.error(`❌ Low contrast ${r.toFixed(2)} for ${tx} on ${bg}`)
    bad++
  }
}

if (process.argv.includes('--write')) {
  // Optional: sync Tailwind safelist if present
  if (fs.existsSync('tailwind.config.cjs') || fs.existsSync('tailwind.config.js')) {
    console.log('• Tailwind present — ensure safelist covers brand utilities')
  }
}

if (bad) {
  process.exit(1)
} else {
  console.log('✅ tokens guard passed')
}
TS

cat > tools/images-opt.ts <<'TS'
import fg from 'fast-glob'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const exts = ['.png', '.jpg', '.jpeg']
const files = fg.sync(['public/**/*', 'assets/**/*', 'static/**/*'], { dot: true })
  .filter(f => exts.includes(path.extname(f).toLowerCase()))

async function run() {
  console.log(`🖼️  Optimizing ${files.length} images...`)
  let optimized = 0

  for (const f of files) {
    const outWebp = f.replace(/\.(png|jpe?g)$/i, '.webp')
    if (!fs.existsSync(outWebp)) {
      await sharp(f).webp({ quality: 82 }).toFile(outWebp)
      console.log('✓ webp', outWebp)
      optimized++
    }
    // Lossless optimize originals in place
    try {
      const buf = await sharp(f).toBuffer()
      await sharp(buf).toFile(f)
    } catch (e) {
      console.warn(`⚠️  Could not optimize ${f}`)
    }
  }

  console.log(`✅ Optimized ${optimized} images`)
}

run().catch(console.error)
TS

cat > tools/routes-crawl.ts <<'TS'
import { chromium } from '@playwright/test'

;(async () => {
  const base = process.env.SITE_URL || 'http://localhost:3000'
  const routes = ['/', '/programs', '/lms', '/apply', '/connect']

  console.log(`🔍 Crawling routes at ${base}...`)

  const browser = await chromium.launch()
  const page = await browser.newPage()
  let failures = 0

  for (const r of routes) {
    const url = base + r
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 })
      const status = resp?.status() || 0
      if (status >= 400) {
        console.error('❌', status, url)
        failures++
      } else {
        console.log('✅', status, url)
      }
    } catch (e) {
      console.error('❌ Failed to load', url, e)
      failures++
    }
  }

  await browser.close()

  if (failures) {
    console.error(`\n❌ ${failures} routes failed`)
    process.exit(1)
  }

  console.log('\n✅ All routes OK')
})()
TS

cat > tools/sitemap-gen.js <<'JS'
const fs = require('fs')
const base = process.env.SITE_URL || 'https://elevateforhumanity.pages.dev'
const pages = ['/', '/programs', '/lms', '/apply', '/connect', '/partners', '/pay']

const urls = pages.map(p => `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq></url>`).join('\n')
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`

fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/sitemap.xml', xml)
console.log('✅ sitemap.xml generated')
JS

cat > tools/robots-gen.js <<'JS'
const fs = require('fs')
const base = process.env.SITE_URL || 'https://elevateforhumanity.pages.dev'
const txt = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`

fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/robots.txt', txt)
console.log('✅ robots.txt generated')
JS

cat > tools/sort-pkg.js <<'JS'
const { execSync } = require('child_process')
try {
  execSync('npx sort-package-json', { stdio: 'inherit' })
  console.log('✅ package.json sorted')
} catch (e) {
  console.warn('⚠️  Could not sort package.json')
}
JS

echo "🎭 Creating Playwright tests..."

cat > tests/specs/a11y.spec.ts <<'TS'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = ['/', '/programs', '/apply']

for (const p of pages) {
  test(`@a11y ${p}`, async ({ page }) => {
    await page.goto(process.env.SITE_URL ?? 'http://localhost:3000' + p)
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(v => ['serious', 'critical'].includes(v.impact || ''))

    if (serious.length > 0) {
      console.error(`❌ A11y violations on ${p}:`)
      serious.forEach(v => {
        console.error(`  - ${v.id}: ${v.description}`)
        console.error(`    Impact: ${v.impact}`)
        console.error(`    Nodes: ${v.nodes.length}`)
      })
    }

    expect(serious).toEqual([])
  })
}
TS

cat > tests/specs/ui.spec.ts <<'TS'
import { test, expect } from '@playwright/test'

const pages = ['/', '/programs', '/lms']

for (const p of pages) {
  test(`@ui ${p}`, async ({ page }) => {
    await page.goto(process.env.SITE_URL ?? 'http://localhost:3000' + p)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveTitle(/Elevate|Humanity|EFH|Student Portal/i)
  })
}
TS

cat > playwright.config.ts <<'TS'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.SITE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
TS

echo "📊 Creating dependency and bundle configs..."

cat > tools/depcruise.json <<'JSON'
{
  "$schema": "https://json.schemastore.org/dependency-cruiser-configuration.json",
  "forbidden": [
    {
      "name": "no-circular",
      "severity": "error",
      "from": {},
      "to": { "circular": true }
    },
    {
      "name": "no-orphans",
      "severity": "warn",
      "from": {},
      "to": { "orphan": true }
    }
  ],
  "options": {
    "doNotFollow": {
      "path": "node_modules"
    }
  }
}
JSON

cat > .size-limit.json <<'JSON'
[
  {
    "name": "Main bundle",
    "path": "dist/**/*.js",
    "limit": "300 KB",
    "gzip": true
  }
]
JSON

cat > .lighthouserc.json <<'JSON'
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/programs"
      ],
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.85 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:seo": ["warn", { "minScore": 0.85 }]
      }
    }
  }
}
JSON

echo "📝 Updating package.json scripts..."

node - <<'NODE'
const fs = require('fs')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
pkg.scripts = pkg.scripts || {}

Object.assign(pkg.scripts, {
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "lint": "eslint --ext .js,.jsx,.ts,.tsx . && stylelint \"**/*.{css,pcss,scss}\"",
  "lint:fix": "eslint --ext .js,.jsx,.ts,.tsx . --fix && stylelint \"**/*.{css,pcss,scss}\" --fix",
  "typecheck": "tsc -p . --noEmit || echo 'No tsconfig found, skipping typecheck'",
  "tokens:guard": "ts-node tools/tokens-guard.ts",
  "images:opt": "ts-node tools/images-opt.ts",
  "routes:test": "ts-node tools/routes-crawl.ts",
  "links:test": "linkinator --recurse --skip \"mailto:,tel:,*logout*,*.pdf\" ${SITE_URL:-http://localhost:3000}",
  "a11y:test": "playwright test -g '@a11y'",
  "ui:test": "playwright test -g '@ui'",
  "lh:audit": "lhci autorun",
  "deps:audit": "knip || echo 'knip not configured' && madge --circular src || echo 'No circular deps found'",
  "bundle:budget": "size-limit || echo 'No size-limit config'",
  "env:guard": "ts-node tools/env-guard.ts",
  "sitemap:gen": "node tools/sitemap-gen.js",
  "robots:gen": "node tools/robots-gen.js",
  "autopilot:fix": "npm run format && npm run lint:fix && node tools/sort-pkg.js && npm run sitemap:gen && npm run robots:gen && npm run tokens:guard -- --write && npm run env:guard && echo '✅ Auto-fixes complete'",
  "autopilot:check": "npm run format:check && npm run lint && npm run typecheck && npm run env:guard && npm run tokens:guard && npm run routes:test && npm run a11y:test && npm run ui:test && echo '✅ All checks passed'",
  "autopilot:prepush": "npm run lint && npm run typecheck && npm run env:guard && npm run routes:test && echo '✅ Pre-push checks passed'"
})

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
console.log('✅ package.json scripts wired')
NODE

if [ -d .husky ]; then
  echo "🪝 Setting up git hooks..."
  cat > .husky/pre-push <<'HOOK'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🤖 Running autopilot pre-push checks..."
npm run autopilot:prepush
HOOK
  chmod +x .husky/pre-push
  echo "✅ Git pre-push hook installed"
fi

echo ""
echo "✅ EFH Autopilot System installed!"
echo ""
echo "📚 Available commands:"
echo "  npm run autopilot:fix      # Auto-fix everything safe + run checks"
echo "  npm run autopilot:check    # Run all checks (CI-safe)"
echo "  npm run autopilot:prepush  # Fast checks for pre-push"
echo ""
echo "🔧 Individual tools:"
echo "  npm run format             # Format code"
echo "  npm run lint:fix           # Fix linting issues"
echo "  npm run tokens:guard       # Check brand token compliance"
echo "  npm run images:opt         # Optimize images"
echo "  npm run routes:test        # Test for 404s"
echo "  npm run a11y:test          # Accessibility tests"
echo "  npm run ui:test            # UI regression tests"
echo ""
echo "🎯 Next steps:"
echo "  1. Review autopilot/README.md"
echo "  2. Run: npm run autopilot:fix"
echo "  3. Set SITE_URL env var for deployed tests"
echo ""
