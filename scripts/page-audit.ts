/**
 * Page Audit Script
 * Identifies common issues: broken images, missing alt text, stub content
 */

import { glob } from 'glob';
import * as fs from 'fs';

interface AuditResult {
  file: string;
  issues: string[];
}

async function auditPages() {
  const results: AuditResult[] = [];
  const pages = await glob('app/**/page.tsx');
  
  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf-8');
    const issues: string[] = [];
    
    // Check for placeholder text
    if (content.includes('Lorem ipsum') || content.includes('lorem ipsum')) {
      issues.push('⚠️ Contains Lorem ipsum text');
    }
    if (content.includes('Coming soon') || content.includes('coming soon')) {
      issues.push('⚠️ Contains "Coming soon" text');
    }
    if (content.includes('Back home only') || content.includes('back.home')) {
      issues.push('⚠️ Contains "Back home only" placeholder');
    }
    if (content.includes('Placeholder') || content.includes('placeholder')) {
      issues.push('⚠️ Contains "Placeholder" text');
    }
    
    // Check for missing alt text on images
    const imgMatches = content.match(/<Image[^>]*>/g) || [];
    for (const img of imgMatches) {
      if (!img.includes('alt=')) {
        issues.push('⚠️ Image without alt attribute');
      }
    }
    
    // Check for hardcoded inline styles (should use Tailwind)
    if (/<div style={{/.test(content)) {
      issues.push('⚠️ Contains inline styles');
    }
    
    // Check for missing responsive image sizing
    if (/<img/.test(content) && !/sizes=/.test(content)) {
      issues.push('⚠️ <img> tag without sizes attribute');
    }
    
    // Check for missing viewport animations
    if (content.includes('whileInView') || content.includes('viewport=')) {
      // Good - has scroll animations
    } else if (content.includes('map(') && content.includes('div')) {
      issues.push('💡 Could benefit from scroll animations');
    }
    
    if (issues.length > 0) {
      results.push({ file: page, issues });
    }
  }
  
  console.log('\n📋 PAGE AUDIT RESULTS\n');
  console.log('═'.repeat(60));
  
  if (results.length === 0) {
    console.log('✅ No issues found!');
  } else {
    for (const result of results) {
      console.log(`\n📄 ${result.file}`);
      result.issues.forEach(issue => console.log(`   ${issue}`));
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\nTotal pages audited: ${pages.length}`);
  console.log(`Pages with issues: ${results.length}`);
}

auditPages().catch(console.error);
