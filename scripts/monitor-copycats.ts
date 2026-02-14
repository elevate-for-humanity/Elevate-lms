/**
 * Copycat Detection Script
 * 
 * Run periodically to check for unauthorized copies of the site.
 * Can be run manually or scheduled via cron/GitHub Actions.
 * 
 * Usage:
 *   npx ts-node scripts/monitor-copycats.ts
 *   
 * Or add to package.json:
 *   "scripts": { "monitor": "ts-node scripts/monitor-copycats.ts" }
 */

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  suspicious: boolean;
  reason?: string;
}

interface MonitoringReport {
  timestamp: string;
  searchTerms: string[];
  results: SearchResult[];
  suspiciousCount: number;
}

// Unique identifiers that should only appear on our site
const UNIQUE_IDENTIFIERS = [
  'EFH-ORIGINAL-2024',
  'Elizabeth L. Greene',
  'elevateforhumanity.org',
  'Elevate for Humanity',
  'dmca@www.elevateforhumanity.org',
];

// Our official domains - exclude from suspicious results
const OFFICIAL_DOMAINS = [
  'elevateforhumanity.org',
  'www.elevateforhumanity.org',
  'github.com/elevateforhumanity',
];

// Search queries to monitor
const SEARCH_QUERIES = [
  '"Elevate for Humanity" -site:elevateforhumanity.org',
  '"EFH-ORIGINAL-2024"',
  '"workforce development apprenticeship" "elevate"',
  // removed - no vercel deployments
  'site:netlify.app "elevate" "workforce"',
];

/**
 * Check if a URL is from our official domains
 */
function isOfficialDomain(url: string): boolean {
  return OFFICIAL_DOMAINS.some(domain => url.includes(domain));
}

/**
 * Analyze a potential copycat site
 */
async function analyzeSite(url: string): Promise<{
  hasCopiedContent: boolean;
  evidence: string[];
}> {
  const evidence: string[] = [];
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CopyrightMonitor/1.0)',
      },
    });
    
    if (!response.ok) {
      return { hasCopiedContent: false, evidence: ['Could not fetch page'] };
    }
    
    const html = await response.text();
    
    // Check for our watermarks
    for (const identifier of UNIQUE_IDENTIFIERS) {
      if (html.includes(identifier)) {
        evidence.push(`Found watermark: "${identifier}"`);
      }
    }
    
    // Check for specific code patterns
    if (html.includes('data-site-owner') && html.includes('Elevate')) {
      evidence.push('Found data-site-owner attribute');
    }
    
    if (html.includes('site_original_owner')) {
      evidence.push('Found localStorage watermark reference');
    }
    
    return {
      hasCopiedContent: evidence.length > 0,
      evidence,
    };
  } catch (error) {
    return { hasCopiedContent: false, evidence: [`Error: ${error}`] };
  }
}

/**
 * Generate monitoring report
 */
function generateReport(results: SearchResult[]): MonitoringReport {
  const suspicious = results.filter(r => r.suspicious);
  
  return {
    timestamp: new Date().toISOString(),
    searchTerms: SEARCH_QUERIES,
    results,
    suspiciousCount: suspicious.length,
  };
}

/**
 * Send alert if suspicious sites found
 */
async function sendAlert(report: MonitoringReport): Promise<void> {
  if (report.suspiciousCount === 0) {
    console.log('✅ No suspicious sites found');
    return;
  }
  
  console.log(`⚠️  Found ${report.suspiciousCount} suspicious site(s)!`);
  console.log('\nSuspicious URLs:');
  
  report.results
    .filter(r => r.suspicious)
    .forEach(r => {
      console.log(`\n  URL: ${r.url}`);
      console.log(`  Reason: ${r.reason}`);
    });
  
  // TODO: Integrate with email/Slack notifications
  // await sendEmail({
  //   to: 'legal@www.elevateforhumanity.org',
  //   subject: `Copyright Alert: ${report.suspiciousCount} potential infringement(s)`,
  //   body: JSON.stringify(report, null, 2),
  // });
}

/**
 * Manual check for a specific URL
 */
export async function checkUrl(url: string): Promise<void> {
  console.log(`\nAnalyzing: ${url}`);
  
  if (isOfficialDomain(url)) {
    console.log('✅ This is an official domain');
    return;
  }
  
  const analysis = await analyzeSite(url);
  
  if (analysis.hasCopiedContent) {
    console.log('🚨 POTENTIAL INFRINGEMENT DETECTED');
    console.log('Evidence:');
    analysis.evidence.forEach(e => console.log(`  - ${e}`));
    console.log('\nNext steps:');
    console.log('  1. Screenshot the site');
    console.log('  2. Save page source');
    console.log('  3. File DMCA takedown (see docs/COPYRIGHT-PROTECTION.md)');
  } else {
    console.log('✅ No copied content detected');
  }
}

/**
 * Main monitoring function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Elevate for Humanity - Copyright Monitoring');
  console.log('='.repeat(60));
  console.log(`\nTimestamp: ${new Date().toISOString()}`);
  
  // Check if a specific URL was provided
  const targetUrl = process.argv[2];
  if (targetUrl) {
    await checkUrl(targetUrl);
    return;
  }
  
  console.log('\nMonitoring for unauthorized copies...');
  console.log('\nSearch queries:');
  SEARCH_QUERIES.forEach(q => console.log(`  - ${q}`));
  
  console.log('\n' + '-'.repeat(60));
  console.log('MANUAL MONITORING STEPS:');
  console.log('-'.repeat(60));
  console.log(`
1. Google Search (do these searches manually):
   ${SEARCH_QUERIES.map(q => `\n   https://www.google.com/search?q=${encodeURIComponent(q)}`).join('')}

2. Image Search:
   - Go to https://images.google.com
   - Click camera icon
   - Upload your logo from /public/images/logo.png
   - Look for unauthorized uses

3. Code Search:
   - https://github.com/search?q=EFH-ORIGINAL-2024
   - https://github.com/search?q="Elevate+for+Humanity"

4. Check specific URL:
   npx ts-node scripts/monitor-copycats.ts https://suspicious-site.com
`);

  console.log('-'.repeat(60));
  console.log('AUTOMATED MONITORING OPTIONS:');
  console.log('-'.repeat(60));
  console.log(`
For automated monitoring, consider:

1. Google Alerts (Free):
   https://www.google.com/alerts
   Set up alerts for: "Elevate for Humanity", "EFH-ORIGINAL-2024"

2. Copyscape (Paid):
   https://www.copyscape.com/copysentry.php
   $5/month for 10 pages monitored weekly

3. DMCA.com Protection (Paid):
   https://www.dmca.com/Badges.aspx
   $10/month includes monitoring + takedown service

4. GitHub Actions (Free):
   Schedule this script to run weekly
   See .github/workflows/copyright-monitor.yml
`);
}

// Run if called directly
main().catch(console.error);
