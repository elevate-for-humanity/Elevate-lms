export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const data = await req.formData();

    const program = data.get("program") as string;
    const funding = data.get("funding") as string;

    // WIOA-style prescreen
    const eligible = funding !== "Self Pay" && program !== "Not Sure";

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    const { error } = await supabase.from("applications").insert({
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone"),
      program,
      funding,
      eligible,
      notes: eligible ? "Prescreen passed" : "Needs review",
    });

    if (error) throw error;

    return NextResponse.redirect(
      new URL("/apply/success", req.url),
      { status: 303 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Submission failed" },
      { status: 500 }
    );
  }
}
