
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();
    const body = await req.json();

    const { data, error }: any = await supabase
      .from("tax_intake")
      .insert({
        service_type: body.service_type,
        diy_service: body.diy_service || null,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        notes: body.notes || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, intake_id: data.id });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Only allow service role to list intakes
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.includes(process.env.SUPABASE_SERVICE_ROLE_KEY!)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error }: any = await supabase
    .from("tax_intake")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ intakes: data });
}
