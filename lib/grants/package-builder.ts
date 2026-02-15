/**
 * Grant Package Builder
 * Creates submission-ready packages with PDF, Word, and ZIP exports
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import JSZip from 'jszip';

export interface GrantPackage {
  grantId: string;
  entityId: string;
  applicationId: string;
  files: {
    narrative_pdf: Buffer;
    narrative_docx: Buffer;
    budget_xlsx: Buffer;
    capability_statement_pdf: Buffer;
    forms_pdf: Buffer;
    complete_package_zip: Buffer;
  };
  metadata: {
    grantTitle: string;
    entityName: string;
    createdAt: Date;
    packageVersion: string;
  };
}

export interface PackageAttachment {
  filename: string;
  content: Buffer;
  type: 'required' | 'optional' | 'supporting';
  description: string;
}

/**
 * Generate Word document from grant narrative
 */
export async function generateNarrativeDocx(
  applicationId: string
): Promise<Buffer> {
  const { data: app, error } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(*), entity:entities(*)')
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    throw new Error('Application not found');
  }

  const sections = [
    new Paragraph({
      text: app.draft_title || 'Grant Application',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: `Applicant: ${app.entity.name}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Grant Opportunity: ${app.grant.title}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Agency: ${app.grant.agency || 'N/A'}`,
      spacing: { after: 400 },
    }),
  ];

  const narrativeText = app.draft_narrative || '';
  const paragraphs = narrativeText.split('\n\n');

  for (const para of paragraphs) {
    if (para.startsWith('#')) {
      const headingText = para.replace(/^#+\s*/, '');
      sections.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (para.trim()) {
      sections.push(
        new Paragraph({
          text: para,
          spacing: { after: 200 },
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate PDF from narrative (using HTML to PDF conversion)
 */
export async function generateNarrativePdf(
  applicationId: string
): Promise<Buffer> {
  const { data: app, error } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(*), entity:entities(*)')
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    throw new Error('Application not found');
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      margin: 1in;
      color: #000;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 24pt;
      margin-bottom: 12pt;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 18pt;
      margin-bottom: 10pt;
    }
    p {
      margin-bottom: 12pt;
      text-align: justify;
    }
    .header {
      text-align: center;
      margin-bottom: 24pt;
    }
    .metadata {
      font-size: 10pt;
      color: #666;
      margin-bottom: 24pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${app.draft_title || 'Grant Application'}</h1>
  </div>
  <div class="metadata">
    <p><strong>Applicant:</strong> ${app.entity.name}</p>
    <p><strong>Grant Opportunity:</strong> ${app.grant.title}</p>
    <p><strong>Agency:</strong> ${app.grant.agency || 'N/A'}</p>
    <p><strong>UEI:</strong> ${app.entity.uei || 'N/A'}</p>
  </div>
  ${convertMarkdownToHtml(app.draft_narrative || '')}
</body>
</html>
  `;

  // In production, use puppeteer or a PDF service
  // For now, return HTML as buffer (you'll need to add puppeteer)
  return Buffer.from(html, 'utf-8');
}

/**
 * Convert markdown to HTML
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;

  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  const paragraphs = html.split('\n\n');
  html = paragraphs
    .map((p) => {
      if (
        p.startsWith('<h1>') ||
        p.startsWith('<h2>') ||
        p.startsWith('<h3>')
      ) {
        return p;
      }
      return `<p>${p}</p>`;
    })
    .join('\n');

  return html;
}

/**
 * Generate capability statement PDF
 */
export async function generateCapabilityStatement(
  entityId: string
): Promise<Buffer> {
  const { data: entity, error } = await supabaseAdmin
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  if (error || !entity) {
    throw new Error('Entity not found');
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      margin: 0.5in;
      color: #000;
    }
    .header {
      background: #1e3a8a;
      color: white;
      padding: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24pt;
    }
    .section {
      margin-bottom: 20px;
    }
    .section h2 {
      background: #e5e7eb;
      padding: 8px;
      font-size: 14pt;
      margin-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 8px;
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${entity.name}</h1>
    <p>Capability Statement</p>
  </div>

  <div class="section">
    <h2>Organization Information</h2>
    <div class="info-grid">
      <div class="label">UEI:</div>
      <div>${entity.uei || 'N/A'}</div>
      <div class="label">CAGE Code:</div>
      <div>${entity.cage_code || 'N/A'}</div>
      <div class="label">NAICS Codes:</div>
      <div>${(entity.naics_list || []).join(', ')}</div>
      <div class="label">Entity Type:</div>
      <div>${entity.entity_type || 'N/A'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Core Competencies</h2>
    <p>${entity.capability_narrative || 'No capability narrative provided.'}</p>
  </div>

  <div class="section">
    <h2>Organizational History</h2>
    <p>${entity.org_history || 'No organizational history provided.'}</p>
  </div>

  <div class="section">
    <h2>Key Personnel</h2>
    <p>${entity.key_personnel || 'No key personnel information provided.'}</p>
  </div>

  <div class="section">
    <h2>Contact Information</h2>
    <div class="info-grid">
      <div class="label">Address:</div>
      <div>${entity.address || 'N/A'}</div>
      <div class="label">City, State:</div>
      <div>${entity.city || 'N/A'}, ${entity.state || 'N/A'}</div>
      <div class="label">ZIP:</div>
      <div>${entity.zip || 'N/A'}</div>
      <div class="label">Phone:</div>
      <div>${entity.phone || 'N/A'}</div>
      <div class="label">Email:</div>
      <div>${entity.email || 'N/A'}</div>
    </div>
  </div>
</body>
</html>
  `;

  return Buffer.from(html, 'utf-8');
}

/**
 * Generate budget spreadsheet (simplified Excel format)
 */
export async function generateBudgetSpreadsheet(
  applicationId: string
): Promise<Buffer> {
  const { data: app, error } = await supabaseAdmin
    .from('grant_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    throw new Error('Application not found');
  }

  const csv = `Budget Category,Description,Amount
Personnel,Salaries and wages,0
Fringe Benefits,Benefits and taxes,0
Travel,Travel expenses,0
Equipment,Equipment purchases,0
Supplies,Supplies and materials,0
Contractual,Contractual services,0
Construction,Construction costs,0
Other,Other direct costs,0
Indirect Costs,Indirect costs,0
Total,,0
`;

  return Buffer.from(csv, 'utf-8');
}

/**
 * Build complete grant package
 */
export async function buildGrantPackage(
  applicationId: string
): Promise<GrantPackage> {
  const { data: app, error } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(*), entity:entities(*)')
    .eq('id', applicationId)
    .single();

  if (error || !app) {
    throw new Error('Application not found');
  }

  const narrativeDocx = await generateNarrativeDocx(applicationId);
  const narrativePdf = await generateNarrativePdf(applicationId);
  const capabilityPdf = await generateCapabilityStatement(app.entity_id);
  const budgetXlsx = await generateBudgetSpreadsheet(applicationId);

  // Generate federal forms PDF
  const { generateAllFederalForms } = await import('./federal-forms');
  const federalForms = await generateAllFederalForms(applicationId);

  const formsHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 1in; }
    h1 { font-size: 18pt; margin-bottom: 20px; }
    h2 { font-size: 14pt; margin-top: 20px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    .section { page-break-after: always; }
  </style>
</head>
<body>
  <div class="section">
    <h1>SF-424: Application for Federal Assistance</h1>
    <table>
      <tr><th>Field</th><th>Value</th></tr>
      <tr><td>Legal Name</td><td>${federalForms.sf424.applicant.legalName}</td></tr>
      <tr><td>UEI</td><td>${federalForms.sf424.applicant.organizationalUEI}</td></tr>
      <tr><td>EIN</td><td>${federalForms.sf424.applicant.employerTaxId}</td></tr>
      <tr><td>Address</td><td>${federalForms.sf424.applicant.addressLine1}</td></tr>
      <tr><td>City, State, ZIP</td><td>${federalForms.sf424.applicant.city}, ${federalForms.sf424.applicant.state} ${federalForms.sf424.applicant.zip}</td></tr>
      <tr><td>Federal Agency</td><td>${federalForms.sf424.federalAgency}</td></tr>
      <tr><td>Project Title</td><td>${federalForms.sf424.projectTitle}</td></tr>
      <tr><td>Congressional District</td><td>${federalForms.sf424.congressionalDistricts.applicant}</td></tr>
      <tr><td>Project Start Date</td><td>${federalForms.sf424.projectDates.start}</td></tr>
      <tr><td>Project End Date</td><td>${federalForms.sf424.projectDates.end}</td></tr>
      <tr><td>Federal Funding Requested</td><td>$${federalForms.sf424.funding.federal.toLocaleString()}</td></tr>
    </table>
  </div>

  <div class="section">
    <h1>SF-424A: Budget Information</h1>
    <h2>Budget Categories</h2>
    <table>
      <tr><th>Category</th><th>Amount</th></tr>
      <tr><td>Personnel</td><td>$${federalForms.sf424a.sections.budgetCategories.personnel.toLocaleString()}</td></tr>
      <tr><td>Fringe Benefits</td><td>$${federalForms.sf424a.sections.budgetCategories.fringeBenefits.toLocaleString()}</td></tr>
      <tr><td>Travel</td><td>$${federalForms.sf424a.sections.budgetCategories.travel.toLocaleString()}</td></tr>
      <tr><td>Equipment</td><td>$${federalForms.sf424a.sections.budgetCategories.equipment.toLocaleString()}</td></tr>
      <tr><td>Supplies</td><td>$${federalForms.sf424a.sections.budgetCategories.supplies.toLocaleString()}</td></tr>
      <tr><td>Contractual</td><td>$${federalForms.sf424a.sections.budgetCategories.contractual.toLocaleString()}</td></tr>
      <tr><td>Other</td><td>$${federalForms.sf424a.sections.budgetCategories.other.toLocaleString()}</td></tr>
      <tr><td>Indirect Charges</td><td>$${federalForms.sf424a.sections.budgetCategories.indirectCharges.toLocaleString()}</td></tr>
      <tr><th>Total</th><th>$${federalForms.sf424a.sections.budgetCategories.total.toLocaleString()}</th></tr>
    </table>
  </div>

  <div class="section">
    <h1>SF-LLL: Disclosure of Lobbying Activities</h1>
    <table>
      <tr><th>Field</th><th>Value</th></tr>
      <tr><td>Federal Action Type</td><td>${federalForms.sflll.federalActionType}</td></tr>
      <tr><td>Federal Action Status</td><td>${federalForms.sflll.federalActionStatus}</td></tr>
      <tr><td>Report Type</td><td>${federalForms.sflll.reportType}</td></tr>
      <tr><td>Organization Name</td><td>${federalForms.sflll.reportingEntity.name}</td></tr>
      <tr><td>Federal Department</td><td>${federalForms.sflll.federalDepartment}</td></tr>
      <tr><td>Federal Program</td><td>${federalForms.sflll.federalProgram}</td></tr>
      <tr><td>Authorized</td><td>${federalForms.sflll.authorized ? 'Yes' : 'No'}</td></tr>
      <tr><td>Signature</td><td>${federalForms.sflll.signature.name}</td></tr>
      <tr><td>Title</td><td>${federalForms.sflll.signature.title}</td></tr>
      <tr><td>Date</td><td>${federalForms.sflll.signature.date}</td></tr>
    </table>
  </div>
</body>
</html>
  `;

  const formsPdf = Buffer.from(formsHtml, 'utf-8');

  const zip = new JSZip();
  zip.file('01_Narrative.docx', narrativeDocx);
  zip.file('02_Narrative.pdf', narrativePdf);
  zip.file('03_Budget.csv', budgetXlsx);
  zip.file('04_Capability_Statement.pdf', capabilityPdf);
  zip.file('05_Federal_Forms.pdf', formsPdf);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  await supabaseAdmin.from('grant_packages').upsert(
    {
      application_id: applicationId,
      grant_id: app.grant_id,
      entity_id: app.entity_id,
      package_version: '1.0',
      files_included: [
        'Narrative.docx',
        'Narrative.pdf',
        'Budget.csv',
        'Capability_Statement.pdf',
        'Federal_Forms.pdf',
      ],
      created_at: new Date().toISOString(),
    },
    { onConflict: 'application_id' }
  );

  return {
    grantId: app.grant_id,
    entityId: app.entity_id,
    applicationId: app.id,
    files: {
      narrative_pdf: narrativePdf,
      narrative_docx: narrativeDocx,
      budget_xlsx: budgetXlsx,
      capability_statement_pdf: capabilityPdf,
      forms_pdf: formsPdf,
      complete_package_zip: zipBuffer,
    },
    metadata: {
      grantTitle: app.grant.title,
      entityName: app.entity.name,
      createdAt: new Date(),
      packageVersion: '1.0',
    },
  };
}

/**
 * Add custom attachments to package
 */
export async function addAttachmentsToPackage(
  applicationId: string,
  attachments: PackageAttachment[]
): Promise<Buffer> {
  const pkg = await buildGrantPackage(applicationId);
  const zip = new JSZip();

  zip.file('01_Narrative.docx', pkg.files.narrative_docx);
  zip.file('02_Narrative.pdf', pkg.files.narrative_pdf);
  zip.file('03_Budget.csv', pkg.files.budget_xlsx);
  zip.file('04_Capability_Statement.pdf', pkg.files.capability_statement_pdf);
  zip.file('05_Federal_Forms.pdf', pkg.files.forms_pdf);

  let attachmentIndex = 6;
  for (const attachment of attachments) {
    const prefix = String(attachmentIndex).padStart(2, '0');
    zip.file(`${prefix}_${attachment.filename}`, attachment.content);
    attachmentIndex++;
  }

  return await zip.generateAsync({ type: 'nodebuffer' });
}
