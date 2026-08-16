from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} occurrence(s), found {count}: {old[:140]!r}")
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
          throw new Error(`Invalid quiz answer in lesson: ${lesson.lesson_title}`);
        }""",
)
replace_exact(
    publish,
    """      if (lesson.estimated_minutes < 3)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      if (lesson.narration_script.trim().length < 400)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });""",
    """      if (lesson.estimated_minutes < 3) {
        throw new Error(`Lesson duration below minimum: ${lesson.lesson_title}`);
      }
      if (lesson.narration_script.trim().length < 400) {
        throw new Error(`Narration below minimum length: ${lesson.lesson_title}`);
      }""",
)
replace_exact(
    publish,
    """    if (coverageError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });""",
    """    if (coverageError) throw new Error(coverageError);""",
)
replace_exact(
    publish,
    """  if (courseErr || !courseRow)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });""",
    """  if (courseErr || !courseRow) {
    throw new Error(`Failed to create course: ${courseErr?.message ?? 'missing course row'}`);
  }""",
)

chat = "apps/admin/app/api/devstudio/chat/route.ts"
replace_exact(chat, "${PLATFORM_DEFAULTS.orgName}", r"\${PLATFORM_DEFAULTS.orgName}")
replace_exact(
    chat,
    """type ToolCallRecord = { tool: string; args: Record<string, unknown>; result: string };
type ChatProvider = 'auto' | 'groq' | 'openai' | 'gemini' | 'anthropic';""",
    """type ToolCallRecord = { tool: string; args: Record<string, unknown>; result: string };
type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };
type ChatProvider = 'auto' | 'groq' | 'openai' | 'gemini' | 'anthropic';""",
)
replace_exact(
    chat,
    "function toChatMessages(messages: { role: string; content: string }[]) {",
    "function toChatMessages(messages: ChatMessage[]) {",
)
replace_exact(
    chat,
    """    let messages: { role: string; content: string }[] = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else if (typeof body.message === 'string') {""",
    """    let messages: ChatMessage[] = [];
    if (Array.isArray(body.messages)) {
      messages = body.messages
        .filter(
          (message: unknown): message is { role: string; content: string } =>
            !!message &&
            typeof message === 'object' &&
            'role' in message &&
            'content' in message &&
            typeof (message as { role?: unknown }).role === 'string' &&
            typeof (message as { content?: unknown }).content === 'string',
        )
        .filter((message) => ['user', 'assistant', 'system'].includes(message.role))
        .map((message) => ({
          role: message.role as ChatMessage['role'],
          content: message.content,
        }));
    } else if (typeof body.message === 'string') {""",
)
replace_exact(
    chat,
    "const toolCallRequests = choice?.message?.tool_calls ?? [];",
    """const toolCallRequests = (choice?.message?.tool_calls ?? []).filter(
            (toolCall) => toolCall.type === 'function',
          );""",
    expected=2,
)


gitroute = "apps/admin/app/api/devstudio/git/route.ts"
replace_exact(
    gitroute,
    """    .map((line) => {
      const parts = line.split('\\t');
      const status = parts[0] ?? '';
      if (status.startsWith('R')) return { status: 'R', oldPath: parts[1], path: parts[2] };
      return { status: status[0], path: parts[1] };
    })
    .filter((entry): entry is { status: string; path: string; oldPath?: string } => !!entry.path);""",
    """    .flatMap((line) => {
      const parts = line.split('\\t');
      const status = parts[0] ?? '';
      if (status.startsWith('R')) {
        const oldPath = parts[1];
        const path = parts[2];
        return oldPath && path ? [{ status: 'R', oldPath, path }] : [];
      }
      const path = parts[1];
      return path ? [{ status: status[0] ?? '', path }] : [];
    });""",
)

builder = "lib/curriculum/builders/buildCanonicalCourseFromBlueprint.ts"
replace_exact(
    builder,
    "          curriculumMap.set(row.lesson_slug, row as CurriculumRow);",
    """          if (typeof row.lesson_slug === 'string') {
            curriculumMap.set(row.lesson_slug, row as CurriculumRow);
          }""",
)
replace_exact(
    builder,
    "      logger.error(`[seeder] DB update error [${lessonRef.slug}]:`, error.message, error.details);",
    """      logger.error(`[seeder] DB update error [${lessonRef.slug}]:`, error, {
        details: error.details,
      });""",
)

ellie = "lib/ellie/executor.ts"
replace_exact(
    ellie,
    """  const { error, count } = await db
    .from('program_enrollments')
    .update({ status: 'at_risk', at_risk_reason: params.reason ?? 'Flagged by Ellie', at_risk_flagged_at: new Date().toISOString() })
    .in('id', enrollmentIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('id', { count: 'exact', head: true } as any);

  if (error) throw new Error(`Failed to flag enrollments: ${error.message}`);
  return { success: true, message: `${count ?? enrollmentIds.length} enrollment(s) flagged as at-risk.` };""",
    """  const { data, error } = await db
    .from('program_enrollments')
    .update({ status: 'at_risk', at_risk_reason: params.reason ?? 'Flagged by Ellie', at_risk_flagged_at: new Date().toISOString() })
    .in('id', enrollmentIds)
    .select('id');

  if (error) throw new Error(`Failed to flag enrollments: ${error.message}`);
  return { success: true, message: `${data?.length ?? enrollmentIds.length} enrollment(s) flagged as at-risk.` };""",
)
replace_exact(
    ellie,
    """  const { error, count } = await db
    .from('program_enrollments')
    .update({ status: 'active', at_risk_reason: null, at_risk_flagged_at: null })
    .in('id', enrollmentIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select('id', { count: 'exact', head: true } as any);

  if (error) throw new Error(`Failed to clear at-risk flags: ${error.message}`);
  return { success: true, message: `${count ?? enrollmentIds.length} enrollment(s) cleared.` };""",
    """  const { data, error } = await db
    .from('program_enrollments')
    .update({ status: 'active', at_risk_reason: null, at_risk_flagged_at: null })
    .in('id', enrollmentIds)
    .select('id');

  if (error) throw new Error(`Failed to clear at-risk flags: ${error.message}`);
  return { success: true, message: `${data?.length ?? enrollmentIds.length} enrollment(s) cleared.` };""",
)

print("Guarded PR 664 Admin repairs applied in workspace")
