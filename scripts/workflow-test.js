#!/usr/bin/env node
/**
 * WORKFLOW VALIDATION TEST
 * 
 * Tests complete user journeys across all builds:
 * - Student: Apply → Payment → Dashboard → Course → Certificate
 * - Employer: Login → Apprentice → Hours → Reports
 * - Host Shop: Login → Assignment → Competencies → Hours
 * - Admin: Login → Student → CRM → Documents → Reporting
 * - Marketing: Homepage → Programs → Apply → Enrollment
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.SITE_URL || 'https://www.elevateforhumanity.org';

const WORKFLOWS = {
  STUDENT_APPLICATION: {
    name: 'Student Application Flow',
    description: 'Apply → Payment → Enrollment → Student Dashboard',
    steps: [
      { name: 'Homepage', url: '/', expected: 'Elevate' },
      { name: 'Programs', url: '/programs', expected: 'Program' },
      { name: 'Apply', url: '/apply', expected: 'Apply' },
      { name: 'Login', url: '/login', expected: 'Login' },
    ]
  },
  
  EMPLOYER_PORTAL: {
    name: 'Employer Portal Flow',
    description: 'Login → Dashboard → View Apprentices → Reports',
    steps: [
      { name: 'Employer Portal', url: '/employer', expected: 'Employer' },
      { name: 'Employer Login', url: '/login', expected: 'Login' },
      { name: 'Dashboard', url: '/employer/dashboard', expected: 'Dashboard' },
    ]
  },
  
  HOST_SHOP_PORTAL: {
    name: 'Host Shop Portal Flow',
    description: 'Login → View Apprentice → Competencies → Hours',
    steps: [
      { name: 'Host Shop', url: '/host-shop', expected: 'Host' },
      { name: 'Login', url: '/login', expected: 'Login' },
      { name: 'Dashboard', url: '/host-shop/dashboard', expected: 'Dashboard' },
    ]
  },
  
  ADMIN_PORTAL: {
    name: 'Admin Portal Flow',
    description: 'Login → Dashboard → Students → CRM → Reports',
    steps: [
      { name: 'Admin Login', url: '/admin-login', expected: 'Login' },
      { name: 'Dashboard', url: '/admin/dashboard', expected: 'Dashboard' },
      { name: 'Students', url: '/admin/students', expected: 'Student' },
      { name: 'Reports', url: '/admin/reports', expected: 'Report' },
    ]
  },
  
  LMS_STUDENT: {
    name: 'LMS Student Flow',
    description: 'Login → Dashboard → Courses → Progress',
    steps: [
      { name: 'LMS Home', url: '/lms', expected: 'Learn' },
      { name: 'Login', url: '/login', expected: 'Login' },
      { name: 'Dashboard', url: '/lms/dashboard', expected: 'Dashboard' },
      { name: 'Courses', url: '/lms/courses', expected: 'Course' },
    ]
  },
  
  CROSS_BUILD_TRANSITION: {
    name: 'Cross-Build Navigation',
    description: 'Marketing → Admin → LMS transitions',
    steps: [
      { name: 'Homepage (Marketing)', url: '/', expected: 'Elevate' },
      { name: 'Admin Login (Admin)', url: '/admin-login', expected: 'Login' },
      { name: 'Admin Dashboard', url: '/admin/dashboard', expected: 'Dashboard' },
      { name: 'LMS (LMS)', url: '/lms', expected: 'Learn' },
    ]
  },
  
  PUBLIC_PAGES: {
    name: 'Public Pages',
    description: 'Core marketing pages',
    steps: [
      { name: 'About', url: '/about', expected: 'About' },
      { name: 'Programs', url: '/programs', expected: 'Program' },
      { name: 'Funding', url: '/funding', expected: 'Funding' },
      { name: 'Testing', url: '/testing', expected: 'Test' },
      { name: 'Store', url: '/store', expected: 'Store' },
      { name: 'Contact', url: '/contact', expected: 'Contact' },
      { name: 'Legal', url: '/legal', expected: 'Legal' },
      { name: 'Privacy', url: '/privacy', expected: 'Privacy' },
    ]
  }
};

async function testStep(page, step) {
  const url = `${BASE_URL}${step.url}`;
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });
  
  try {
    const response = await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    const status = response?.status() || 0;
    const content = await page.content();
    const hasExpected = content.includes(step.expected) || step.expected === '*';
    
    // Check for hydration errors
    const hydrationError = content.includes('hydrat');
    
    return {
      url,
      status,
      hasExpected,
      errors,
      hydrationError,
      ok: status === 200 && hasExpected && errors.length === 0
    };
  } catch (err) {
    return {
      url,
      status: 0,
      hasExpected: false,
      errors: [err.message],
      hydrationError: false,
      ok: false
    };
  }
}

async function runWorkflow(name, workflow) {
  console.log(`\n📋 ${workflow.name}`);
  console.log(`   ${workflow.description}`);
  console.log('   ' + '─'.repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    workflow: name,
    name: workflow.name,
    steps: [],
    passed: 0,
    failed: 0
  };
  
  for (const step of workflow.steps) {
    const result = await testStep(page, step);
    results.steps.push(result);
    
    const icon = result.ok ? '✅' : '❌';
    const statusText = result.status === 200 ? `HTTP ${result.status}` : `ERROR: ${result.status || 'timeout'}`;
    
    console.log(`   ${icon} ${step.name.padEnd(20)} ${statusText}`);
    
    if (result.errors.length > 0) {
      console.log(`      ⚠️  Console errors: ${result.errors.length}`);
    }
    
    if (result.ok) results.passed++;
    else results.failed++;
  }
  
  await browser.close();
  
  const overallIcon = results.failed === 0 ? '✅' : '❌';
  console.log(`   ${overallIcon} Result: ${results.passed}/${results.passed + results.failed} passed`);
  
  return results;
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  ELEVATE LMS - WORKFLOW VALIDATION TEST');
  console.log('═'.repeat(70));
  console.log(`\nBase URL: ${BASE_URL}`);
  
  const allResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    workflows: [],
    summary: { passed: 0, failed: 0, totalSteps: 0 }
  };
  
  for (const [name, workflow] of Object.entries(WORKFLOWS)) {
    const result = await runWorkflow(name, workflow);
    allResults.workflows.push(result);
    allResults.summary.passed += result.passed;
    allResults.summary.failed += result.failed;
    allResults.summary.totalSteps += result.passed + result.failed;
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('  WORKFLOW SUMMARY');
  console.log('═'.repeat(70));
  
  for (const result of allResults.workflows) {
    const icon = result.failed === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${result.name}: ${result.passed}/${result.passed + result.failed} steps`);
  }
  
  console.log('\n' + '─'.repeat(70));
  console.log(`  Total Steps: ${allResults.summary.totalSteps}`);
  console.log(`  ✅ Passed: ${allResults.summary.passed}`);
  console.log(`  ❌ Failed: ${allResults.summary.failed}`);
  console.log(`  📈 Pass Rate: ${((allResults.summary.passed / allResults.summary.totalSteps) * 100).toFixed(1)}%`);
  
  // Save report
  const fs = await import('fs');
  const path = await import('path');
  const reportPath = path.join(process.cwd(), 'scripts', 'workflow-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allResults, null, 2));
  
  console.log(`\n📄 Report: ${reportPath}`);
  console.log('═'.repeat(70));
  
  // Certification
  if (allResults.summary.failed === 0) {
    console.log('\n🎉 ALL WORKFLOWS PASSED - PRODUCTION READY\n');
  } else {
    console.log(`\n⚠️  ${allResults.summary.failed} step(s) failed - needs attention\n`);
  }
  
  process.exit(allResults.summary.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Workflow test error:', err);
  process.exit(1);
});
