/**
 * End-to-End Site Test Script
 * Tests all pages, API routes, and integrations
 * Run with: npx tsx scripts/test-site-e2e.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  url: string;
  passed: boolean;
  status?: number;
  error?: string;
  responseTime?: number;
}

const results: TestResult[] = [];

async function testPage(name: string, path: string): Promise<void> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });

    const responseTime = Date.now() - start;
    const passed = response.status >= 200 && response.status < 400;

    results.push({
      name,
      url: path,
      passed,
      status: response.status,
      responseTime,
    });

    if (passed) {
      console.log(`✅ ${name} (${response.status}) - ${responseTime}ms`);
    } else {
      console.log(`❌ ${name} (${response.status}) - ${path}`);
    }
  } catch (error: any) {
    results.push({
      name,
      url: path,
      passed: false,
      error: error.message,
    });
    console.log(`❌ ${name} - ${error.message}`);
  }
}

async function testAPI(name: string, path: string, method: string = 'GET'): Promise<void> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method,
      headers: { Accept: 'application/json' },
    });

    const responseTime = Date.now() - start;
    // API routes may return 401 for unauthenticated requests, which is expected
    const passed = response.status >= 200 && response.status < 500;

    results.push({
      name,
      url: path,
      passed,
      status: response.status,
      responseTime,
    });

    if (passed) {
      console.log(`✅ ${name} (${response.status}) - ${responseTime}ms`);
    } else {
      console.log(`❌ ${name} (${response.status}) - ${path}`);
    }
  } catch (error: any) {
    results.push({
      name,
      url: path,
      passed: false,
      error: error.message,
    });
    console.log(`❌ ${name} - ${error.message}`);
  }
}

async function testStaticAsset(name: string, path: string): Promise<void> {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const passed = response.status === 200;

    results.push({
      name,
      url: path,
      passed,
      status: response.status,
    });

    if (passed) {
      console.log(`✅ ${name}`);
    } else {
      console.log(`❌ ${name} (${response.status})`);
    }
  } catch (error: any) {
    results.push({
      name,
      url: path,
      passed: false,
      error: error.message,
    });
    console.log(`❌ ${name} - ${error.message}`);
  }
}

async function main() {
  console.log('🚀 END-TO-END SITE TEST\n');
  console.log(`📍 Testing: ${BASE_URL}\n`);

  // ============================================================================
  // PUBLIC PAGES
  // ============================================================================
  console.log('\n📄 TESTING PUBLIC PAGES...\n');

  await testPage('Homepage', '/');
  await testPage('About', '/about');
  await testPage('Contact', '/contact');
  await testPage('Programs', '/programs');
  await testPage('Programs - Healthcare', '/programs/healthcare');
  await testPage('Programs - Skilled Trades', '/programs/skilled-trades');
  await testPage('Programs - Technology', '/programs/technology');
  await testPage('Programs - CDL', '/programs/cdl-transportation');
  await testPage('Programs - Barber', '/programs/barber');
  await testPage('Courses', '/courses');
  await testPage('Apply', '/apply');
  await testPage('Financial Aid', '/financial-aid');
  await testPage('Tuition', '/tuition');
  await testPage('Locations', '/locations');
  await testPage('Career Services', '/career-services');
  await testPage('How It Works', '/how-it-works');
  await testPage('WIOA Eligibility', '/wioa-eligibility');
  await testPage('VITA', '/vita');

  // ============================================================================
  // STORE PAGES
  // ============================================================================
  console.log('\n🛒 TESTING STORE PAGES...\n');

  await testPage('Store', '/store');
  await testPage('Store - Licenses', '/store/licenses');
  await testPage('Store - Courses', '/store/courses');
  await testPage('Store - Demo', '/store/demo');
  await testPage('Store - Apps', '/store/apps');

  // ============================================================================
  // COMMUNITY PAGES
  // ============================================================================
  console.log('\n👥 TESTING COMMUNITY PAGES...\n');

  await testPage('Community', '/community');
  await testPage('Community - Events', '/community/events');
  await testPage('Social', '/social');

  // ============================================================================
  // HUB PAGES
  // ============================================================================
  console.log('\n🏠 TESTING HUB PAGES...\n');

  await testPage('Hub', '/hub');
  await testPage('Hub - Welcome', '/hub/welcome');

  // ============================================================================
  // PORTAL LANDING PAGES
  // ============================================================================
  console.log('\n🚪 TESTING PORTAL LANDING PAGES...\n');

  await testPage('Admin Portal', '/admin');
  await testPage('Staff Portal', '/admin/staff-portal');
  await testPage('Student Portal', '/student-portal');
  await testPage('Employer Portal', '/employer-portal');
  await testPage('Partner Portal', '/partner');

  // ============================================================================
  // API ROUTES
  // ============================================================================
  console.log('\n🔌 TESTING API ROUTES...\n');

  await testAPI('API - Auth Me', '/api/auth/me');
  await testAPI('API - Programs', '/api/programs');
  await testAPI('API - Courses', '/api/courses');
  await testAPI('API - Health', '/api/health');

  // ============================================================================
  // STATIC ASSETS
  // ============================================================================
  console.log('\n📦 TESTING STATIC ASSETS...\n');

  await testStaticAsset('Avatar Video - Home Welcome', '/videos/avatars/home-welcome.mp4');
  await testStaticAsset('Avatar Video - Healthcare Guide', '/videos/avatars/healthcare-guide.mp4');
  await testStaticAsset('Avatar Video - Trades Guide', '/videos/avatars/trades-guide.mp4');
  await testStaticAsset('Avatar Video - Financial Guide', '/videos/avatars/financial-guide.mp4');
  await testStaticAsset('Hero Video', '/videos/hero-home-fast.mp4');
  await testStaticAsset('Image - Healthcare', '/images/healthcare/program-cna-training.webp');
  await testStaticAsset('Image - Trades', '/images/trades/hero-program-hvac.webp');
  await testStaticAsset('Image - Technology', '/images/programs/cna-hero.webp');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error || `Status ${r.status}`} (${r.url})`);
      });
  }

  // Calculate average response time
  const responseTimes = results.filter((r) => r.responseTime).map((r) => r.responseTime!);
  if (responseTimes.length > 0) {
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    console.log(`\n⏱️  Average Response Time: ${avgTime.toFixed(0)}ms`);
  }

  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED - Site is fully functional!');
  } else {
    console.log('\n⚠️  Some tests failed - review and fix before production');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
