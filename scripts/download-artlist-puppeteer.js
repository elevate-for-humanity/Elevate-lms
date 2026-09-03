/**
 * Download Artlist Images with Puppeteer
 *
 * This script uses Puppeteer to bypass Cloudflare protection.
 * Requires: npm install puppeteer
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Check if puppeteer is installed
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('❌ Puppeteer not installed. Run: npm install puppeteer');
  process.exit(1);
}

const images = [
  {
    pageUrl: 'https://artlist.io/text-to-image-ai/creations/ae1fd783-34c7-4468-81a3-aba4e1e87813',
  },
  {
    pageUrl: 'https://artlist.io/text-to-image-ai/creations/a6fb219d-6fb7-401d-9da9-d40a6819f204',
  },
  {
    pageUrl: 'https://artlist.io/text-to-image-ai/creations/a34be5f8-316c-47ed-925d-c65e14bcba67',
  },
  {
    name: 'Career Services - Hero Banner',
    pageUrl: 'https://artlist.io/text-to-image-ai/creations/a34be5f8-316c-47ed-925d-c65e14bcba67',
    savePath: 'public/images/career-services/hero-banner.jpg',
  },
  {
    name: 'Skilled Trades - Hero Banner',
    pageUrl: 'https://artlist.io/text-to-image-ai/creations/5573d3b3-65e3-4dc5-9735-9955ae90e593',
    savePath: 'public/images/programs/skilled-trades-hero.jpg',
  },
];

async function downloadImageFromUrl(imageUrl, savePath) {
  return new Promise((resolve, reject) => {
    https
      .get(imageUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          downloadImageFromUrl(response.headers.location, savePath).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const fileStream = fs.createWriteStream(savePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', reject);
      })
      .on('error', reject);
  });
}

async function extractImageUrl(page, pageUrl) {
  console.log('   Loading page...');
  await page.goto(pageUrl, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // Wait for Cloudflare challenge to complete
  console.log('   Waiting for Cloudflare...');
  await page.waitForTimeout(5000);

  // Try to find the main image
  console.log('   Extracting image URL...');

  const imageUrl = await page.evaluate(() => {
    // Try multiple selectors
    const selectors = [
      'img[alt*="creation"]',
      'img[src*="artlist"]',
      'img.main-image',
      'img[class*="creation"]',
      'main img',
      'article img',
      'div[class*="image"] img',
    ];

    for (const selector of selectors) {
      const img = document.querySelector(selector);
      if (img && img.src && img.src.startsWith('http')) {
        return img.src;
      }
    }

    // Fallback: get the largest image
    const allImages = Array.from(document.querySelectorAll('img'));
    const validImages = allImages.filter(
      (img) =>
        img.src &&
        img.src.startsWith('http') &&
        !img.src.includes('icon') &&
        !img.src.includes('logo'),
    );

    if (validImages.length > 0) {
      // Sort by size and return largest
      validImages.sort(
        (a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight,
      );
      return validImages[0].src;
    }

    return null;
  });

  return imageUrl;
}

async function downloadWithPuppeteer(image) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    const imageUrl = await extractImageUrl(page, image.pageUrl);

    if (!imageUrl) {
      throw new Error('Could not find image URL on page');
    }

    console.log(`   Found image: ${imageUrl.substring(0, 80)}...`);
    console.log('   Downloading...');

    await downloadImageFromUrl(imageUrl, image.savePath);

    console.log(`✅ Success! Saved to: ${image.savePath}\n`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🖼️  Artlist Image Downloader (Puppeteer)\n');
  console.log('This script uses a headless browser to bypass Cloudflare.\n');

  let successCount = 0;
  let failCount = 0;

  for (const image of images) {
    try {
      console.log(`📥 Downloading: ${image.name}`);
      console.log(`   URL: ${image.pageUrl}`);

      await downloadWithPuppeteer(image);
      successCount++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log('\n📊 Results:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\n💡 For failed downloads, try:');
    console.log('   1. Manually download from browser');
    console.log('   2. Check if you need to log in to Artlist');
    console.log('   3. Verify the URLs are still valid');
  }
}

main().catch(console.error);
