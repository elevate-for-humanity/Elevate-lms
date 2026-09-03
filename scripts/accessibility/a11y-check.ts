import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const url = process.env.A11Y_URL || 'https://www.elevateforhumanity.org';

  await page.goto(url, { waitUntil: 'networkidle' });

  // Inject axe-core
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js',
  });

  // Run axe accessibility tests
  const results = await page.evaluate(async () => {
    return await axe.run();
  });

  // Create output directory
  const outDir = path.join(process.cwd(), 'a11y-reports');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Save full results
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));

  // Generate summary
  const summary = {
    url,
    timestamp: new Date().toISOString(),
    violations: results.violations.length,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    inapplicable: results.inapplicable.length,
    violationDetails: results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    })),
  };

  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  // Generate HTML report
  const html = generateHTMLReport(summary, results);
  fs.writeFileSync(path.join(outDir, 'report.html'), html);

  // Console output

  if (results.violations.length > 0) {
    results.violations.forEach((v: any) => {});
  }

  await browser.close();

  // Exit with error code if violations found
  process.exit(results.violations.length > 0 ? 1 : 0);
}

function generateHTMLReport(summary: any, results: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${summary.url}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    .violations {
      background: white;
      padding: 20px;
      border-radius: 8px;
    }
    .violation {
      border-left: 4px solid #e74c3c;
      padding: 15px;
      margin-bottom: 15px;
      background: #fff5f5;
    }
    .violation.critical { border-color: #c0392b; }
    .violation.serious { border-color: #e74c3c; }
    .violation.moderate { border-color: #f39c12; }
    .violation.minor { border-color: #f1c40f; }
    .violation-header {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .violation-help {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    .violation-link {
      color: #3498db;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Accessibility Report</h1>
    <p><strong>URL:</strong> ${summary.url}</p>
    <p><strong>Generated:</strong> ${new Date(summary.timestamp).toLocaleString()}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value" style="color: #e74c3c;">${summary.violations}</div>
      <div class="stat-label">Violations</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #27ae60;">${summary.passes}</div>
      <div class="stat-label">Passes</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #f39c12;">${summary.incomplete}</div>
      <div class="stat-label">Incomplete</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #95a5a6;">${summary.inapplicable}</div>
      <div class="stat-label">Inapplicable</div>
    </div>
  </div>

  <div class="violations">
    <h2>Violations</h2>
    ${
      summary.violations === 0
        ? '<p>No violations found! 🎉</p>'
        : summary.violationDetails
            .map(
              (v: any) => `
      <div class="violation ${v.impact}">
        <div class="violation-header">
          [${v.impact.toUpperCase()}] ${v.id}
        </div>
        <p>${v.description}</p>
        <p><strong>Affected elements:</strong> ${v.nodes}</p>
        <div class="violation-help">
          <strong>How to fix:</strong> ${v.help}<br>
          <a href="${v.helpUrl}" class="violation-link" target="_blank">Learn more →</a>
        </div>
      </div>
    `,
            )
            .join('')
    }
  </div>
</body>
</html>
  `;
}

run().catch((err) => {
  process.exit(1);
});
