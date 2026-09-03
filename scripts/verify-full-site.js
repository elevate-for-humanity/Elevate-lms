#!/usr/bin/env node
// Verify that the full site is properly deployed
const fs = require('fs');
const path = require('path');

function verifyFullSite() {
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.html');


  if (!fs.existsSync(indexPath)) {
    return false;
  }

  const content = fs.readFileSync(indexPath, 'utf8');

  // Check for comprehensive content indicators
  const checks = [
    {
      name: 'Has comprehensive title',
      test: content.includes('Launch Your AI & Data Science Career'),
    },
    {
      name: 'Has proper meta description',
      test: content.includes('Transform your career with federally-funded'),
    },
    {
      name: 'Has navigation content',
      test: content.includes('efh-nav-primary'),
    },
    {
      name: 'Has correct canonical URL',
      test: content.includes(
        'canonical" href="https://elevateforhumanity.org/"'
      ),
    },
    {
      name: 'No old Replit URLs',
      test: !content.includes('stripe-integrate-curvaturebodysc.replit.app'),
    },
    {
      name: 'Has structured data',
      test: content.includes('application/ld+json'),
    },
    {
      name: 'Has main content sections',
      test: content.includes('class="') && content.length > 10000,
    },
  ];

  let allPassed = true;
  checks.forEach((check) => {
    if (check.test) {
    } else {
      allPassed = false;
    }
  });

  if (allPassed) {
      '🎉 Full site verification PASSED - site is ready for deployment!'
    );
  } else {
  }

  // Report file sizes for monitoring
  const stats = fs.statSync(indexPath);

  return allPassed;
}

const passed = verifyFullSite();
process.exit(passed ? 0 : 1);
