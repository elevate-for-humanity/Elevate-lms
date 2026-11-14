/**
 * Download Artlist Images
 *
 * This script attempts to download images from Artlist URLs.
 * Note: Artlist uses Cloudflare protection which may block automated downloads.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const images = [
  {
    url: 'https://artlist.io/text-to-image-ai/creations/ae1fd783-34c7-4468-81a3-aba4e1e87813',
  },
  {
    url: 'https://artlist.io/text-to-image-ai/creations/a6fb219d-6fb7-401d-9da9-d40a6819f204',
  },
  {
    url: 'https://artlist.io/text-to-image-ai/creations/a34be5f8-316c-47ed-925d-c65e14bcba67',
  },
  {
    name: 'Career Services - Hero Banner',
    url: 'https://artlist.io/text-to-image-ai/creations/a34be5f8-316c-47ed-925d-c65e14bcba67',
    savePath: 'public/images/career-services/hero-banner.jpg',
  },
  {
    name: 'Skilled Trades - Hero Banner',
    url: 'https://artlist.io/text-to-image-ai/creations/5573d3b3-65e3-4dc5-9735-9955ae90e593',
    savePath: 'public/images/programs/skilled-trades-hero.jpg',
  },
];

async function downloadImage(url, savePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    };

    protocol
      .get(url, options, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          downloadImage(response.headers.location, savePath).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        // Ensure directory exists
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

        fileStream.on('error', (err) => {
          fs.unlink(savePath, () => {}); // Delete partial file
          reject(err);
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🖼️  Artlist Image Downloader\n');
  console.log('⚠️  Note: Artlist uses Cloudflare protection.');
  console.log('   This script may not work due to bot detection.\n');

  for (const image of images) {
    try {
      console.log(`📥 Downloading: ${image.name}`);
      console.log(`   URL: ${image.url}`);
      console.log(`   Save to: ${image.savePath}`);

      await downloadImage(image.url, image.savePath);

      console.log(`✅ Success!\n`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }

  console.log('\n📋 Summary:');
  console.log('If downloads failed due to Cloudflare protection, you have two options:');
  console.log('1. Manually download images from the URLs in IMAGES_TO_DOWNLOAD.md');
  console.log('2. Use the Puppeteer script (requires Chrome/Chromium installed)');
}

main().catch(console.error);
