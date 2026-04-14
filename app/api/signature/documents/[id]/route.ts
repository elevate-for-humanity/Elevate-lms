import { apiRequireAdmin } from '@/lib/admin/guards';
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  const supabase = await createClient();

  const { data: doc, error } = await supabase
    .from("signature_documents")
    .select(`
      *,
      signatures(*)
    `)
    .eq("id", id)
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document: doc });
}
export const GET = withApiAudit('/api/signature/documents/[id]', _GET);
