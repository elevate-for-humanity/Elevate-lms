import { createHash, randomUUID } from "node:crypto";

export const MAX_MANUAL_LESSON_BYTES = 25 * 1024 * 1024;

/** Store an already assembled film for review. Never author, render, queue or publish it. */
export async function storeManualLessonFilm({
  db,
  courseId,
  lessonId,
  title,
  bytes,
  contentType,
  actorId,
  upload,
  sign,
}) {
  if (!courseId || !lessonId || !title?.trim())
    throw Error("MANUAL_LESSON_IDENTITY_REQUIRED");
  if (
    !["video/mp4", "video/webm", "video/quicktime"].includes(contentType) ||
    !bytes?.length ||
    bytes.length > MAX_MANUAL_LESSON_BYTES
  )
    throw Error("MANUAL_LESSON_FILE_INVALID");
  const lesson = await db
    .from("course_lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (lesson.error) throw lesson.error;
  if (!lesson.data) throw Error("MANUAL_LESSON_COURSE_MISMATCH");
  const ext = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  }[contentType];
  const key = `course-videos/manual-lessons/${courseId}/${lessonId}/${randomUUID()}.${ext}`;
  const stored = await upload(bytes, key, contentType);
  if (!stored?.success) throw Error("MANUAL_LESSON_STORAGE_FAILED");
  const url = stored.url || (await sign(key, 3600, { contentType }));
  if (!url) throw Error(`MANUAL_LESSON_SIGNING_FAILED_ASSET_RETAINED:${key}`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const saved = await db
    .from("course_videos")
    .insert({
      course_id: courseId,
      lesson_id: lessonId,
      title: title.trim(),
      video_url: url,
      storage_path: key,
      generated_by: "manual",
      // Reference until real inspection and explicit lesson publication succeed.
      asset_role: "reference",
      status: "ready",
      created_by: actorId,
    })
    .select("id,title,course_id,lesson_id,storage_path,status,created_at")
    .single();
  if (saved.error || !saved.data)
    throw Error(`MANUAL_LESSON_INDEX_FAILED_ASSET_RETAINED:${key}`);
  return {
    success: true,
    url,
    video: saved.data,
    sha256,
    bytes: bytes.length,
    reviewRequired: true,
  };
}
