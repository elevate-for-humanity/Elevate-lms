from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} occurrence(s), found {count}: {old[:120]!r}")
    p.write_text(text.replace(old, new))


publish = "apps/admin/app/api/admin/courses/generate/publish/route.ts"
replace_exact(
    publish,
    """      if (seen.has(key))
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });""",
    """      if (seen.has(key)) {
        throw new Error(`Duplicate lesson title: ${lesson.lesson_title}`);
      }""",
)
replace_exact(
    publish,
    """        if (!q.options.includes(q.correct_answer)) {
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }""",
    """        if (!q.options.includes(q.correct_answer)) {
          throw new Error(`Invalid quiz answer for lesson: ${lesson.lesson_title}`);
        }""",
)
replace_exact(
    publish,
    """      if (lesson.estimated_minutes < 3)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      if (lesson.narration_script.trim().length < 400)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });""",
    """      if (lesson.estimated_minutes < 3) {
        throw new Error(`Lesson duration is too short: ${lesson.lesson_title}`);
      }
      if (lesson.narration_script.trim().length < 400) {
        throw new Error(`Narration is incomplete: ${lesson.lesson_title}`);
      }""",
)
replace_exact(
    publish,
    """  if (draft.program_id) {
    const coverageError = await checkCoverageGate(draft.program_id, draft.auto_publish);
    if (coverageError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }""",
    """  if (draft.program_id) {
    const coverageError = await checkCoverageGate(draft.program_id, draft.auto_publish);
    if (coverageError) throw new Error(coverageError);
  }""",
)
replace_exact(
    publish,
    """  if (courseErr || !courseRow)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });""",
    """  if (courseErr || !courseRow) {
    throw new Error(courseErr?.message || 'Course publication did not return a course row');
  }""",
)

chat = "apps/admin/app/api/devstudio/chat/route.ts"
replace_exact(chat, "${PLATFORM_DEFAULTS.orgName}", r"\${PLATFORM_DEFAULTS.orgName}")
replace_exact(
    chat,
    "let messages: { role: string; content: string }[] = [];",
    "let messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];",
)
replace_exact(
    chat,
    """        for (const toolCall of firstToolCalls) {
          const handler = toolHandlers[toolCall.function.name];""",
    """        for (const toolCall of firstToolCalls) {
          if (toolCall.type !== 'function') continue;
          const handler = toolHandlers[toolCall.function.name];""",
)

gitroute = "apps/admin/app/api/devstudio/git/route.ts"
replace_exact(
    gitroute,
    ".filter((entry): entry is { status: string; path: string; oldPath?: string } => !!entry.path);",
    ".filter((entry) => !!entry.path) as Array<{ status: string; path: string; oldPath?: string }>;",
)

builder = "lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts"
replace_exact(builder, "findSocByCode(input.blueprint.socCode)", "findSocByCode(String(input.blueprint.socCode))")
replace_exact(
    builder,
    "logger.error('[Canonical Course Builder] RPC error:', error.message, error.details);",
    "logger.error('[Canonical Course Builder] RPC error:', error.message, { details: error.details });",
)

ellie = "lib/ellie/executor.ts"
replace_exact(
    ellie,
    """      .update({ status: 'at_risk' } as any)
      .in('id', enrollmentIds)
      .select('id', { count: 'exact', head: true } as any);""",
    """      .update({ status: 'at_risk' } as any, { count: 'exact' })
      .in('id', enrollmentIds);""",
)
replace_exact(
    ellie,
    """      .delete()
      .in('id', enrollmentIds)
      .select('id', { count: 'exact', head: true } as any);""",
    """      .delete({ count: 'exact' })
      .in('id', enrollmentIds);""",
)

print("Guarded PR 664 Admin repairs applied in workspace")
