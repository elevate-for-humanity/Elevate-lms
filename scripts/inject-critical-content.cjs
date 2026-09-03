#!/usr/bin/env node

/**
 * Inject critical content into index.html for SEO
 * This ensures search engines can see content even before JS executes
 */

const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '../dist/index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error('❌ dist/index.html not found. Run build first.');
  process.exit(1);
}

let html = fs.readFileSync(distIndexPath, 'utf8');

// Critical content to inject (SEO-friendly)
const criticalContent = `
  <!-- Critical content for SEO and no-JS users -->
  <div style="display:none" id="seo-content">
    <h1>Elevate for Humanity</h1>
    <h2>Empowering People. Elevating Communities.</h2>
    <p>Indianapolis-based government contractor providing workforce development solutions. ETPL provider and DOL apprenticeship sponsor.</p>
    
    <section>
      <h3>Statistics</h3>
      <ul>
        <li>1,247 Students Trained</li>
        <li>92% Job Placement Rate</li>
        <li>$2.85M Funding Distributed</li>
        <li>100% FREE to Students</li>
      </ul>
    </section>
    
    <section>
      <h3>FREE Productivity Suite</h3>
      <p>Professional tools for work, school, and life. No subscription. No limits.</p>
      <ul>
        <li>Sheets - Powerful spreadsheets</li>
        <li>Slides - Create presentations</li>
        <li>Docs - Word processing</li>
        <li>Email - Professional email</li>
        <li>Calendar - Schedule and organize</li>
        <li>Video Meetings - HD conferencing</li>
        <li>File Manager - Cloud storage</li>
        <li>AI Tutor - Personal learning assistant</li>
      </ul>
    </section>
    
    <section>
      <h3>Job Training Programs</h3>
      <ul>
        <li>Construction Pre-Apprenticeship - 12-16 weeks - 95% Placement</li>
        <li>Phlebotomy Technician - 8-10 weeks - 92% Placement</li>
        <li>CDL Truck Driving - 4-8 weeks - 98% Placement</li>
        <li>CPR Instructor - 4-6 weeks - 90% Placement</li>
        <li>Drug Testing Collector - 2-4 weeks - 88% Placement</li>
        <li>Financial Literacy - 6-8 weeks - 85% Placement</li>
      </ul>
    </section>
    
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/programs">Programs</a>
      <a href="/contact">Contact</a>
    </nav>
  </div>
`;

// Inject after opening body tag
html = html.replace('<body>', `<body>\n${criticalContent}`);

// Update noscript to be more helpful
html = html.replace(
  /<noscript>[\s\S]*?<\/noscript>/,
  `<noscript>
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:760px;margin:40px auto;padding:16px;border:1px solid #eee;border-radius:12px">
        <h1>Elevate for Humanity</h1>
        <h2>Empowering People. Elevating Communities.</h2>
        <p>This site requires JavaScript for the full interactive experience.</p>
        <p>We provide FREE workforce training programs in Marion County, IN:</p>
        <ul>
          <li>Construction Pre-Apprenticeship</li>
          <li>Phlebotomy Technician</li>
          <li>CDL Truck Driving</li>
          <li>CPR Instructor</li>
          <li>And more...</li>
        </ul>
        <p><strong>Contact:</strong> Visit elevateforhumanity.org with JavaScript enabled for full details.</p>
      </div>
    </noscript>`,
);

fs.writeFileSync(distIndexPath, html);
console.log('✅ Critical content injected into dist/index.html');
console.log('   - SEO-friendly hidden content added');
console.log('   - Enhanced noscript fallback');
