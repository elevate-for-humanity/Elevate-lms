import { createClient } from "@/lib/supabase/server";

export async function assignAIInstructorForProgram(opts: {
  studentId: string;
  programSlug: string;
}) {
  const supabase = await createClient();

  // find active AI instructor for program
  const { data: instructor, error: iErr } = await supabase
    .from("ai_instructors")
    .select("id, slug, program_slug")
    .eq("program_slug", opts.programSlug)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (iErr || !instructor) {
    return { ok: false, reason: "NO_INSTRUCTOR_CONFIGURED" as const };
  }

  // insert assignment idempotently
  const { error: aErr } = await supabase
    .from("ai_instructor_assignments")
    .upsert(
      {
        student_id: opts.studentId,
        instructor_id: instructor.id,
        program_slug: opts.programSlug,
        status: "active",
      },
      { onConflict: "student_id,instructor_id" }
    );

  if (aErr) {
    return { ok: false, reason: "ASSIGNMENT_FAILED" as const };
  }

  // audit
  await supabase.from("ai_audit_log").insert({
    user_id: opts.studentId,
    action: "ASSIGN_INSTRUCTOR",
    details: { program_slug: opts.programSlug, instructor_slug: instructor.slug },
  });

  return { ok: true, instructorId: instructor.id, instructorSlug: instructor.slug };
}
