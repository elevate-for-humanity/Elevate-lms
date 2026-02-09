import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
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

    // PDF Export
    if (format === 'pdf') {
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      // Title
      doc.fontSize(20).text('Program Catalog', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Programs
      for (const program of programList) {
        doc.fontSize(14).text(program.title || 'Untitled', { underline: true });
        doc.fontSize(10);
        doc.text(`Category: ${program.category || 'N/A'}`);
        doc.text(`Duration: ${program.duration_weeks || 'N/A'} weeks | ${program.total_hours || 'N/A'} hours`);
        doc.text(`Tuition: $${program.tuition?.toLocaleString() || 'N/A'}`);
        if (program.description) {
          doc.moveDown(0.5);
          doc.text(program.description.substring(0, 200) + (program.description.length > 200 ? '...' : ''));
        }
        doc.moveDown();
      }

      doc.end();

      // Wait for PDF to be generated
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
