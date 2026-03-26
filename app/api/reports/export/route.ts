import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { format, dateRange, customStartDate, customEndDate, groupByCategory, includeSignatures, includePhotos } = body;

    // Get apprentice record
    const { data: apprentice, error: apprenticeError } = await supabase
      .from('apprentices')
      .select('id, user_id, shop_id, shops(name)')
      .eq('user_id', user.id)
      .single();

    if (apprenticeError || !apprentice) {
      return NextResponse.json({ error: 'Apprentice record not found' }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (dateRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Fetch approved hour entries
    const { data: entries, error: entriesError } = await supabase
      .from('hour_entries')
      .select('*')
      .eq('apprentice_id', apprentice.id)
      .eq('status', 'approved')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (entriesError) {
      logger.error('Error fetching entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const apprenticeName = profile?.full_name || user.email || 'Apprentice';
    const shopName = (apprentice as any).shops?.name || 'Unknown Shop';

    // Generate report based on format
    if (format === 'csv') {
      const csvContent = generateCSV(entries || [], apprenticeName, groupByCategory);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="hours-report-${Date.now()}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      const pdfContent = generatePDFContent(entries || [], apprenticeName, shopName, startDate, endDate, groupByCategory);
      // Return HTML that can be printed as PDF
      return new NextResponse(pdfContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="hours-report-${Date.now()}.html"`,
        },
      });
    } else {
      // Excel format - return CSV with Excel-compatible encoding
      const csvContent = generateCSV(entries || [], apprenticeName, groupByCategory);
      return new NextResponse('\ufeff' + csvContent, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="hours-report-${Date.now()}.xls"`,
        },
      });
    }
  } catch (error) {
    logger.error('Report export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateCSV(entries: any[], apprenticeName: string, groupByCategory: boolean): string {
  const headers = ['Date', 'Category', 'Hours', 'Minutes', 'Total Hours', 'Description', 'Location', 'Status'];
  const rows = entries.map(entry => [
    entry.date,
    entry.category || 'General',
    entry.hours || 0,
    entry.minutes || 0,
    ((entry.total_minutes || 0) / 60).toFixed(2),
    (entry.description || '').replace(/,/g, ';'),
    (entry.location || '').replace(/,/g, ';'),
    entry.status,
  ]);

  const totalMinutes = entries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  let csv = `Hours Report for ${apprenticeName}\n`;
  csv += `Generated: ${new Date().toLocaleDateString()}\n`;
  csv += `Total Hours: ${totalHours}\n\n`;
  csv += headers.join(',') + '\n';
  csv += rows.map(row => row.join(',')).join('\n');

  if (groupByCategory) {
    csv += '\n\nSummary by Category\n';
    csv += 'Category,Total Hours\n';
    const byCategory: Record<string, number> = {};
    entries.forEach(e => {
      const cat = e.category || 'General';
      byCategory[cat] = (byCategory[cat] || 0) + (e.total_minutes || 0);
    });
    Object.entries(byCategory).forEach(([cat, mins]) => {
      csv += `${cat},${(mins / 60).toFixed(2)}\n`;
    });
  }

  return csv;
}

function generatePDFContent(
  entries: any[], 
  apprenticeName: string, 
  shopName: string,
  startDate: Date, 
  endDate: Date,
  groupByCategory: boolean
): string {
  const totalMinutes = entries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const byCategory: Record<string, number> = {};
  entries.forEach(e => {
    const cat = e.category || 'General';
    byCategory[cat] = (byCategory[cat] || 0) + (e.total_minutes || 0);
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Hours Report - ${apprenticeName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1e293b; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
    .header { margin-bottom: 30px; }
    .meta { color: #64748b; margin-bottom: 5px; }
    .summary { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .summary h2 { margin-top: 0; color: #1e293b; }
    .total { font-size: 32px; font-weight: bold; color: #7c3aed; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    .category-summary { display: flex; flex-wrap: wrap; gap: 15px; }
    .category-item { background: #f8fafc; padding: 15px; border-radius: 8px; min-width: 150px; }
    .category-name { color: #64748b; font-size: 14px; }
    .category-hours { font-size: 24px; font-weight: bold; color: #1e293b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Apprenticeship Hours Report</h1>
    <p class="meta"><strong>Apprentice:</strong> ${apprenticeName}</p>
    <p class="meta"><strong>Training Location:</strong> ${shopName}</p>
    <p class="meta"><strong>Period:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
    <p class="meta"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <p class="total">${totalHours} Hours</p>
    <p>${entries.length} approved entries</p>
  </div>

  ${groupByCategory ? `
  <h2>Hours by Category</h2>
  <div class="category-summary">
    ${Object.entries(byCategory).map(([cat, mins]) => `
      <div class="category-item">
        <div class="category-name">${cat}</div>
        <div class="category-hours">${(mins / 60).toFixed(1)}h</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <h2>Detailed Log</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Hours</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${entries.map(e => `
        <tr>
          <td>${new Date(e.date).toLocaleDateString()}</td>
          <td>${e.category || 'General'}</td>
          <td>${((e.total_minutes || 0) / 60).toFixed(1)}</td>
          <td>${e.description || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    <p><strong>Supervisor Signature:</strong> _______________________</p>
    <p><strong>Date:</strong> _______________________</p>
  </div>
</body>
</html>
  `;
}
export const POST = withApiAudit('/api/reports/export', _POST);
