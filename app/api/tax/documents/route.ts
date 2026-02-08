import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's documents
    const { data: documents, error } = await supabase
      .from('tax_documents')
      .select('*')
      .eq('email', user.email)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }

    // Generate signed URLs for documents
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        const { data: urlData } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

        return {
          ...doc,
          download_url: urlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithUrls,
      total: documents?.length || 0,
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
