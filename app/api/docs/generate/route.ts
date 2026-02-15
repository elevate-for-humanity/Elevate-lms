import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { fillTemplate } from "@/lib/docs/templateEngine";
import { LETTER_OF_SUPPORT_TEMPLATE } from "@/lib/docs/templates/letterOfSupport";
import { MOU_TEMPLATE } from "@/lib/docs/templates/mou";
import { createClient } from "@/lib/supabase/server";
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, variables } = await req.json();

  const safeVars = variables || {};
  let template: string;

  if (type === "letter_of_support") {
    template = LETTER_OF_SUPPORT_TEMPLATE;
  } else if (type === "mou") {
    template = MOU_TEMPLATE;
  } else {
    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  const filled = fillTemplate(template, safeVars as Record<string, string>);

  return NextResponse.json({ document: filled });
}
