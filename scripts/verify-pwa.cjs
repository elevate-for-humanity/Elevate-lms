#!/usr/bin/env node

/**
 * PWA Verification Script
 * Checks if all PWA requirements are met before deployment
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'public/manifest.json',
  'public/sw.js',
  'public/icon-192.png',
  'public/icon-512.png',
  'app/offline/page.tsx',
];

const REQUIRED_ICON_SIZES = [
  '72x72',
  '96x96',
  '128x128',
  '144x144',
  '152x152',
  '192x192',
  '384x384',
  '512x512',
];

const errors = [];
const warnings = [];
let passed = 0;
let total = 0;

function check(name, condition, errorMsg, warnMsg = null) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ ${name}`);
    return true;
  } else {
    if (warnMsg) {
      warnings.push(warnMsg);
      console.log(`⚠️  ${name}: ${warnMsg}`);
    } else {
      errors.push(errorMsg);
      console.log(`❌ ${name}: ${errorMsg}`);
    }
    return false;
  }
}

console.log('\n🔍 Verifying PWA Configuration...\n');

// Check required files exist
console.log('📁 Checking Required Files:');
REQUIRED_FILES.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  check(file, fs.existsSync(filePath), `File not found: ${file}`);
});

// Check manifest.json
console.log('\n📋 Checking Manifest:');
const manifestPath = path.join(process.cwd(), 'public/manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    check(
      'Manifest has name',
      manifest.name && manifest.name.length > 0,
      'Manifest missing "name" field',
    );

    check(
      'Manifest has short_name',
      manifest.short_name && manifest.short_name.length > 0,
      'Manifest missing "short_name" field',
    );

    check('Manifest has start_url', manifest.start_url, 'Manifest missing "start_url" field');

    check(
      'Manifest has display mode',
      manifest.display && ['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display),
      'Manifest missing or invalid "display" field',
    );

    check(
      'Manifest has theme_color',
      manifest.theme_color,
      'Manifest missing "theme_color" field',
      'Theme color helps with app appearance',
    );

    check(
      'Manifest has background_color',
      manifest.background_color,
      'Manifest missing "background_color" field',
      'Background color used for splash screen',
    );

    check(
      'Manifest has icons',
      manifest.icons && manifest.icons.length > 0,
      'Manifest missing "icons" array',
    );

    if (manifest.icons && manifest.icons.length > 0) {
      const iconSizes = manifest.icons.map((icon) => icon.sizes);
      REQUIRED_ICON_SIZES.forEach((size) => {
        check(
          `Icon ${size}`,
          iconSizes.some((s) => s === size),
          `Missing icon size: ${size}`,
          `Icon size ${size} recommended for better compatibility`,
        );
      });

      // Check for maskable icons
      const hasMaskable = manifest.icons.some(
        (icon) => icon.purpose && icon.purpose.includes('maskable'),
      );
      check(
        'Maskable icons',
        hasMaskable,
        null,
        'No maskable icons found - recommended for Android adaptive icons',
      );
    }
  } catch (error) {
    errors.push(`Failed to parse manifest.json: ${error.message}`);
    console.log(`❌ Manifest parsing: ${error.message}`);
  }
} else {
  errors.push('manifest.json not found');
}

// Check service worker
console.log('\n⚙️  Checking Service Worker:');
const swPath = path.join(process.cwd(), 'public/sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');

  check(
    'SW has install event',
    swContent.includes("addEventListener('install'"),
    'Service worker missing install event listener',
  );

  check(
    'SW has activate event',
    swContent.includes("addEventListener('activate'"),
    'Service worker missing activate event listener',
  );

  check(
    'SW has fetch event',
    swContent.includes("addEventListener('fetch'"),
    'Service worker missing fetch event listener',
  );

  check(
    'SW has cache name',
    /CACHE_NAME|CACHE_VERSION/.test(swContent),
    null,
    'Service worker should define cache name/version',
  );

  check(
    'SW has skipWaiting',
    swContent.includes('skipWaiting'),
    null,
    'Service worker should call skipWaiting() for faster updates',
  );

  check(
    'SW has clients.claim',
    swContent.includes('clients.claim'),
    null,
    'Service worker should call clients.claim() to take control immediately',
  );
} else {
  errors.push('sw.js not found');
}

// Check layout.tsx for PWA integration
console.log('\n🎨 Checking Layout Integration:');
const layoutPath = path.join(process.cwd(), 'app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  check(
    'Manifest linked in metadata',
    layoutContent.includes('manifest:') || layoutContent.includes('manifest.json'),
    'Manifest not linked in layout metadata',
  );

  check(
    'Service worker registration',
    layoutContent.includes('ServiceWorkerRegistration'),
    null,
    'Service worker registration component not found in layout',
  );

  check(
    'Theme color meta tag',
    layoutContent.includes('theme-color'),
    null,
    'Theme color meta tag not found',
  );
} else {
  warnings.push('app/layout.tsx not found - cannot verify integration');
}

// Check for HTTPS requirement
console.log('\n🔒 Security:');
console.log('⚠️  HTTPS: Required for PWA (verify in production)');
console.log('⚠️  Valid SSL Certificate: Required for service workers');

// Check environment variables
console.log('\n🔑 Environment Variables:');
const envExample = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExample)) {
  const envContent = fs.readFileSync(envExample, 'utf8');
  check(
    'VAPID keys documented',
    envContent.includes('VAPID'),
    null,
    'VAPID keys not documented in .env.example (needed for push notifications)',
  );
} else {
  warnings.push('.env.example not found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log('='.repeat(50));
console.log(`✅ Passed: ${passed}/${total}`);
console.log(`❌ Errors: ${errors.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ Errors that must be fixed:');
  errors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings (recommended fixes):');
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
}

console.log('\n' + '='.repeat(50));

if (errors.length === 0) {
  console.log('✅ PWA verification passed!');
  console.log('\nNext steps:');
  console.log('1. Build the application: npm run build');
  console.log('2. Test locally: npm run start');
  console.log('3. Deploy to production');
  console.log('4. Run Lighthouse audit');
  console.log('5. Test installation on mobile devices');
  process.exit(0);
} else {
  console.log('❌ PWA verification failed!');
  console.log('\nFix the errors above before deploying.');
  process.exit(1);
}
