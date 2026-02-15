export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { phoneNumber, name, requestedAt } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error }: any = await supabase
      .from("call_requests")
      .insert({
        phone_number: phoneNumber,
        name,
        status: "pending",
        requested_at: requestedAt,
      })
      .select()
      .single();

    if (error) {
      logger.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) { 
    logger.error("API error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch pending requests (for your team dashboard)
export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { data, error }: any = await supabase
      .from("call_requests")
      .select("*")
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ requests: data || [] });
  } catch (error) { 
    logger.error("API error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
