import { NextRequest, NextResponse } from 'next/server';
import { programs } from '@/app/data/programs';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

async function guardAdmin() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const denied = await guardAdmin();
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'html';

  // Generate HTML content for the catalog
  const catalogHtml = generateCatalogHtml(programs);

  if (format === 'pdf') {
    // Return HTML with print-friendly styles that can be printed to PDF
    return new NextResponse(catalogHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="elevate-program-catalog.html"',
      },
    });
  }

  return new NextResponse(catalogHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

function generateCatalogHtml(programList: typeof programs) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elevate For Humanity - Program Catalog</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-break { page-break-before: always; }
      .no-print { display: none !important; }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
    }
    
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 40px;
    }
    
    .logo { font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
    .subtitle { font-size: 18px; color: #6b7280; }
    .date { font-size: 14px; color: #9ca3af; margin-top: 10px; }
    
    .toc { margin-bottom: 40px; }
    .toc h2 { font-size: 24px; margin-bottom: 20px; color: #1f2937; }
    .toc ul { list-style: none; }
    .toc li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .toc a { color: #2563eb; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    
    .program {
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .program h2 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #2563eb;
    }
    
    .program-meta {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
    }
    
    .meta-item { }
    .meta-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 14px; font-weight: 600; color: #1f2937; }
    .meta-value.highlight { color: #2563eb; }
    
    .program-description { margin-bottom: 20px; color: #4b5563; }
    
    .program-section { margin-bottom: 15px; }
    .program-section h3 { font-size: 16px; color: #1f2937; margin-bottom: 10px; }
    .program-section ul { margin-left: 20px; }
    .program-section li { margin-bottom: 5px; color: #4b5563; }
    
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
  
  <div class="container">
    <div class="header">
      <div class="logo">ELEVATE FOR HUMANITY</div>
      <div class="subtitle">Official Program Catalog</div>
      <div class="date">Generated: ${currentDate}</div>
    </div>
    
    <div class="toc">
      <h2>Table of Contents</h2>
      <ul>
        ${programList.map((p, i) => `
          <li><a href="#program-${i}">${p.name}</a></li>
        `).join('')}
      </ul>
    </div>
    
    <div class="page-break"></div>
    
    ${programList.map((program, i) => `
      <div class="program" id="program-${i}">
        <h2>${program.name}</h2>
        
        <div class="program-meta">
          <div class="meta-item">
            <div class="meta-label">Duration</div>
            <div class="meta-value">${program.duration}</div>
          </div>
          ${program.clockHours ? `
          <div class="meta-item">
            <div class="meta-label">Clock Hours</div>
            <div class="meta-value highlight">${program.clockHours} hours</div>
          </div>
          ` : ''}
          <div class="meta-item">
            <div class="meta-label">Delivery Format</div>
            <div class="meta-value">${program.delivery}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Schedule</div>
            <div class="meta-value">${program.schedule}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Credential</div>
            <div class="meta-value">${program.credential}</div>
          </div>
          ${program.etplProgramId ? `
          <div class="meta-item">
            <div class="meta-label">ETPL Program ID</div>
            <div class="meta-value">${program.etplProgramId}</div>
          </div>
          ` : ''}
        </div>
        
        <div class="program-description">
          <p>${program.shortDescription}</p>
        </div>
        
        ${program.outcomes && program.outcomes.length > 0 ? `
        <div class="program-section">
          <h3>Program Outcomes</h3>
          <ul>
            ${program.outcomes.filter(o => o && o.trim()).map(outcome => `
              <li>${outcome}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${program.requirements && program.requirements.length > 0 ? `
        <div class="program-section">
          <h3>Requirements</h3>
          <ul>
            ${program.requirements.filter(r => r && r.trim()).map(req => `
              <li>${req}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${program.approvals && program.approvals.length > 0 ? `
        <div class="program-section">
          <h3>Approvals & Certifications</h3>
          <ul>
            ${program.approvals.filter(a => a && a.trim()).map(approval => `
              <li>${approval}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        
        ${program.fundingOptions && program.fundingOptions.length > 0 ? `
        <div class="program-section">
          <h3>Funding Options</h3>
          <ul>
            ${program.fundingOptions.filter(f => f && f.trim()).map(funding => `
              <li>${funding}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      
      ${(i + 1) % 2 === 0 ? '<div class="page-break"></div>' : ''}
    `).join('')}
    
    <div class="footer">
      <p><strong>Elevate For Humanity</strong></p>
      <p>Indianapolis, Indiana | (317) 314-3757</p>
      <p>www.elevateforhumanity.org</p>
      <p style="margin-top: 10px; font-size: 12px;">
        This catalog is for informational purposes. Program details subject to change.
        Contact us for the most current information.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
