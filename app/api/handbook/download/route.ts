import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

// Use nodejs runtime since this route uses server-side features
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handbook PDF URL - in production, this would be a signed Supabase storage URL
    const handbookUrl = process.env.HANDBOOK_PDF_URL || 'https://storage.example.com/handbooks/apprentice-handbook-2024.pdf';
    
    return NextResponse.redirect(handbookUrl);
    
  } catch (error) {
    console.error('Handbook download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

export const GET = withRuntime(withApiAudit('/api/handbook/download', handler));
