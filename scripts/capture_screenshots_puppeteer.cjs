const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROUTES = [
  { name: 'store', path: '/store' },
  { name: 'license', path: '/pricing/sponsor-licensing' },
  { name: 'demo', path: '/store/demo' },
  { name: 'demo_admin', path: '/store/demo/admin' },
  { name: 'demo_student', path: '/store/demo/student' },
  { name: 'schedule', path: '/schedule' },
  { name: 'homepage', path: '/' },
];

const OUTPUT_DIR = path.join(__dirname, '../docs/assets/slides');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function captureScreenshots() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.path}`;
    const outputPath = path.join(OUTPUT_DIR, `${route.name}.png`);

    try {
      console.log(`Capturing: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({ path: outputPath });
      console.log(`  ✓ Saved: ${outputPath}`);
      results.push({ route: route.name, status: 'success', path: outputPath });
    } catch (error) {
      console.error(`  ✗ Failed: ${route.name} - ${error.message}`);
      results.push({ route: route.name, status: 'failed', error: error.message });
    }
  }

  await browser.close();

  console.log('\n=== Screenshot Capture Summary ===');
  results.forEach((r) => {
    console.log(`${r.status === 'success' ? '✓' : '✗'} ${r.route}: ${r.status}`);
  });

  return results;
}

captureScreenshots().catch(console.error);
