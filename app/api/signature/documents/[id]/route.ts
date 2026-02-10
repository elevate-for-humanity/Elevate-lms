import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { apiAuthGuard } from '@/lib/authGuards';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
