import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { toErrorMessage } from '@/lib/safe';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is board member
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "board") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("board_org", profile.organization || "")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ referrals });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is board member
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "board") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    participantName,
    participantEmail,
    participantPhone,
    programName,
    courseId,
    notes,
  } = await request.json();

  if (!participantName) {
    return NextResponse.json(
      { error: "participantName is required" },
      { status: 400 }
    );
  }

  const { data: referral, error } = await supabase
    .from("referrals")
    .insert({
      board_org: profile.organization || "Unknown Board",
      board_user_id: user.id,
      participant_name: participantName,
      participant_email: participantEmail || null,
      participant_phone: participantPhone || null,
      program_name: programName || null,
      course_id: courseId || null,
      notes: notes || null,
      status: "referred",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  // Log the referral creation
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "board_created_referral",
    resource_type: "referral",
    resource_id: referral.id,
    metadata: {
      participantName,
      programName,
      boardOrg: profile.organization,
    },
  });

  return NextResponse.json({ referral });
}
