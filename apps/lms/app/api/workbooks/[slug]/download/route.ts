import { NextResponse } from 'next/server';

// Protected workbooks are editable in the authenticated LMS only.
// Do not return source PDFs to clients: an attachment bypasses in-app
// watermarking and permits unrestricted offline redistribution.
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(
    { error: 'Workbook PDF downloads are disabled. Open your workbook in the LMS to complete and save answers.' },
    { status: 403, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } },
  );
}
