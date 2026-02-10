import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Block in production — this endpoint is for development/testing only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const projectRef = url
    ? url.replace(/^https:\/\/([^.]+)\.supabase\.co.*$/, "$1")
    : "";

  return NextResponse.json({
    supabaseProjectRef: projectRef,
    anonKeyPrefix: anon.slice(0, 8),
    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    nodeEnv: process.env.NODE_ENV,
  });
}
