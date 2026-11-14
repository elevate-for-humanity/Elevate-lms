/**
 * PDF Guide Generator
 * Generates the store digital product PDFs
 *
 * Usage: node scripts/pdf-generation/generate-guides.mjs
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './public/downloads/guides';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createPDF(filename, title, subtitle, chapters) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 72 });
    const stream = fs.createWriteStream(path.join(OUTPUT_DIR, filename));

    doc.pipe(stream);

    // Cover page
    doc.fontSize(32).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).font('Helvetica').text(subtitle, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text('Elevate for Humanity', { align: 'center' });
    doc.text('www.elevateforhumanity.org', { align: 'center' });

    // Table of contents
    doc.addPage();
    doc.fontSize(24).font('Helvetica-Bold').text('Table of Contents');
    doc.moveDown();

    chapters.forEach((chapter, i) => {
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`${i + 1}. ${chapter.title}`);
    });

    // Chapters
    chapters.forEach((chapter, i) => {
      doc.addPage();
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text(`Chapter ${i + 1}: ${chapter.title}`);
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(chapter.content, { align: 'justify' });
    });

    // Footer
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').text('About Elevate for Humanity');
    doc.moveDown();
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Elevate for Humanity provides workforce training and career development programs. ' +
          'This guide is educational only and not legal, tax, or financial advice.',
      );

    doc.end();
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

// Capital Readiness Guide
const capitalReadinessChapters = [
  {
    title: "You're Not Broke. You're Untrusted (Yet)",
    content:
      'Trust is the foundation of capital access. Before any institution writes a check, they evaluate whether you can be trusted with their money. This chapter explains how trust is built systematically through documentation, behavior patterns, and institutional signals.',
  },
  {
    title: 'The First Gate: Separating Yourself from the Business',
    content:
      'Entity separation is the first signal of professionalism. This chapter covers LLC formation, EIN acquisition, business banking, and why commingling funds is the fastest way to lose credibility with funders.',
  },
  {
    title: 'Credit Is a Reputation System',
    content:
      'Your credit profile tells a story. This chapter explains business credit building, personal credit optimization, and how lenders interpret your credit behavior as a proxy for business reliability.',
  },
  {
    title: 'Banking Behavior Tells the Truth',
    content:
      'Banks see everything. This chapter covers cash flow management, average daily balances, overdraft patterns, and how banking behavior signals operational maturity to funders.',
  },
  {
    title: 'Taxes Are the Loudest Quiet Signal',
    content:
      'Tax compliance is non-negotiable for institutional funding. This chapter explains quarterly estimates, payroll taxes, 1099 reporting, and why tax problems disqualify more applicants than any other factor.',
  },
  {
    title: 'Public Funding Is Not Flexible Money',
    content:
      'Government and workforce funding comes with strings. This chapter covers WIOA compliance, grant reporting requirements, audit readiness, and the documentation standards that public funders expect.',
  },
  {
    title: 'Growth Reveals Cracks',
    content:
      'Scaling exposes weaknesses. This chapter addresses the operational gaps that emerge during growth and how to build systems that scale without breaking.',
  },
  {
    title: 'The Elevate Model',
    content:
      'A systematic approach to capital readiness. This chapter introduces the Elevate framework for building fundable, audit-ready organizations.',
  },
  {
    title: 'Capital Readiness Levels',
    content:
      'Where are you now? This chapter provides a self-assessment framework to identify your current readiness level and the specific steps needed to advance.',
  },
  {
    title: 'Capital Follows Discipline',
    content:
      'The conclusion: capital is attracted to discipline, not desperation. This chapter summarizes the key principles and provides an action plan for implementation.',
  },
];

// Tax Business Toolkit
const taxToolkitChapters = [
  {
    title: 'Starting a Tax Preparation Business',
    content:
      'Overview of the tax preparation industry, licensing requirements, and the opportunity for new practitioners.',
  },
  {
    title: 'Getting Your PTIN',
    content:
      'Step-by-step guide to obtaining your Preparer Tax Identification Number from the IRS.',
  },
  {
    title: 'Choosing Your Business Structure',
    content:
      'LLC vs sole proprietorship, state registration, and business banking setup for tax preparers.',
  },
  {
    title: 'Software and Technology',
    content:
      'Comparison of professional tax software options, pricing, and features for new practitioners.',
  },
  {
    title: 'Building Your Client Base',
    content:
      'Marketing strategies, referral systems, and client acquisition for tax preparation businesses.',
  },
  {
    title: 'Compliance and Ethics',
    content:
      'IRS Circular 230, due diligence requirements, and ethical obligations for tax preparers.',
  },
  {
    title: 'Pricing Your Services',
    content: 'Fee structures, value-based pricing, and how to communicate value to clients.',
  },
  {
    title: 'Year-Round Revenue',
    content: 'Expanding beyond tax season with bookkeeping, payroll, and advisory services.',
  },
];

// Grant Readiness Guide
const grantReadinessChapters = [
  {
    title: 'Understanding the Grant Landscape',
    content:
      'Overview of federal, state, foundation, and corporate grant opportunities for nonprofits and social enterprises.',
  },
  {
    title: 'Organizational Readiness Assessment',
    content:
      'Self-assessment checklist for grant readiness including governance, financials, and program documentation.',
  },
  {
    title: 'Building Your Grant Infrastructure',
    content:
      'Systems and processes needed before applying: fiscal management, outcome tracking, and reporting capabilities.',
  },
  {
    title: 'Finding the Right Grants',
    content:
      'Research strategies, grant databases, and how to identify grants aligned with your mission and capacity.',
  },
  {
    title: 'Writing Winning Proposals',
    content: 'Structure, narrative, and budget development for competitive grant applications.',
  },
  {
    title: 'Budget Development',
    content:
      'Creating realistic, fundable budgets that align with program design and funder expectations.',
  },
  {
    title: 'Post-Award Management',
    content: 'Grant compliance, reporting requirements, and relationship management with funders.',
  },
  {
    title: 'Building Funder Relationships',
    content:
      'Long-term strategies for cultivating relationships with program officers and foundation staff.',
  },
];

async function main() {
  console.log('Generating PDF guides...\n');

  await createPDF(
    'capital-readiness-guide-v1.pdf',
    'The Elevate Capital Readiness Guide',
    'Build Trust Before You Chase Capital',
    capitalReadinessChapters,
  );
  console.log('✓ capital-readiness-guide-v1.pdf');

  await createPDF(
    'tax-business-toolkit-v1.pdf',
    'Start a Tax Business Toolkit',
    'Your Complete Guide to Launching a Tax Preparation Practice',
    taxToolkitChapters,
  );
  console.log('✓ tax-business-toolkit-v1.pdf');

  await createPDF(
    'grant-readiness-guide-v1.pdf',
    'Grant Readiness Guide',
    'Prepare Your Organization for Funding Success',
    grantReadinessChapters,
  );
  console.log('✓ grant-readiness-guide-v1.pdf');

  console.log(`\nPDFs generated in: ${OUTPUT_DIR}`);
  console.log('\nNext: Upload to R2 bucket at paths:');
  console.log('  guides/capital-readiness-guide-v1.pdf');
  console.log('  guides/tax-business-toolkit-v1.pdf');
  console.log('  guides/grant-readiness-guide-v1.pdf');
}

main().catch(console.error);
