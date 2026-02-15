import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const { data: programs } = await supabase
      .from('programs')
      .select('id, title, slug, description, category, status, tuition, duration_weeks, total_hours')
      .eq('status', 'active')
      .order('title');

    const programList = programs || [];

    // CSV Export
    if (format === 'csv') {
      const headers = ['ID', 'Title', 'Slug', 'Category', 'Status', 'Tuition', 'Duration (weeks)', 'Total Hours'];
      const rows = programList.map(p => [
        p.id, 
        `"${(p.title || '').replace(/"/g, '""')}"`,
        p.slug, 
        p.category, 
        p.status, 
        p.tuition, 
        p.duration_weeks, 
        p.total_hours
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="catalog-export.csv"'
        }
      });
    }

    // XLSX Export (as CSV with xlsx extension - basic implementation)
    if (format === 'xlsx') {
      const headers = ['ID', 'Title', 'Slug', 'Category', 'Status', 'Tuition', 'Duration (weeks)', 'Total Hours'];
      const rows = programList.map(p => [
        p.id, p.title, p.slug, p.category, p.status, p.tuition, p.duration_weeks, p.total_hours
      ].join('\t'));
      const tsv = [headers.join('\t'), ...rows].join('\n');
      
      return new NextResponse(tsv, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="catalog-export.xlsx"'
        }
      });
    }

    // PDF Export - redirect to Netlify function
    if (format === 'pdf') {
      // Transform data for PDF export
      const pdfData = programList.map(p => ({
        title: p.title || 'Untitled',
        category: p.category || 'N/A',
        duration: `${p.duration_weeks || 'N/A'} weeks`,
        hours: `${p.total_hours || 'N/A'} hours`,
        tuition: `$${p.tuition?.toLocaleString() || 'N/A'}`,
      }));

      const pdfResponse = await fetch(`${process.env.URL || ''}/.netlify/functions/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: pdfData,
          options: {
            title: 'Program Catalog',
            subtitle: `Generated: ${new Date().toLocaleDateString()}`,
            columns: [
              { key: 'title', label: 'Program' },
              { key: 'category', label: 'Category' },
              { key: 'duration', label: 'Duration' },
              { key: 'hours', label: 'Hours' },
              { key: 'tuition', label: 'Tuition' },
            ],
          },
          filename: 'catalog-export.pdf',
        }),
      });

      if (!pdfResponse.ok) {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="catalog-export.pdf"'
        }
      });
    }

    // Default: JSON
    return NextResponse.json({
      programs: programList,
      exportedAt: new Date().toISOString(),
      count: programList.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  return GET(request);
}
