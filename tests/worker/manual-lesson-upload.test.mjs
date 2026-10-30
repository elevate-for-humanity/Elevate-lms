import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { createHash } from "node:crypto";
import {
  storeManualLessonFilm,
  MAX_MANUAL_LESSON_BYTES,
} from "../../lib/video/manual-lesson-upload.mjs";

const courseId = "e9a2547c-ae03-418e-97fc-51377d438f8c";
const lessonId = "c3aba828-774a-4c35-a592-7f1b9d85a6c2";
function fixture({
  missing = false,
  indexFailure = false,
  uploadFailure = false,
} = {}) {
  const calls = [];
  const db = {
    from(table) {
      calls.push({ table });
      if (table === "course_lessons")
        return {
          select() {
            return this;
          },
          eq(key, value) {
            calls.push({ key, value });
            return this;
          },
          async maybeSingle() {
            return { data: missing ? null : { id: lessonId }, error: null };
          },
        };
      assert.equal(table, "course_videos");
      return {
        insert(row) {
          calls.push({ insert: row });
          return this;
        },
        select() {
          return this;
        },
        async single() {
          return indexFailure
            ? { error: Error("Index unavailable") }
            : {
                data: { id: "candidate", storage_path: "retained-key" },
                error: null,
              };
        },
      };
    },
  };
  const upload = async (bytes, key, type) => {
    calls.push({ upload: { key, type, bytes: bytes.length } });
    return { success: !uploadFailure, key };
  };
  const sign = async () => {
    calls.push({ sign: true });
    return "https://private-media.example/candidate.mp4";
  };
  return { db, upload, sign, calls };
}
const request = (f) => ({
  ...f,
  courseId,
  lessonId,
  title: "Reviewed orientation",
  bytes: Buffer.from("actual candidate bytes"),
  contentType: "video/mp4",
  actorId: "existing-admin",
});
test("a finished film is retained privately as a review candidate without changing the lesson or queueing", async () => {
  const f = fixture();
  const r = await storeManualLessonFilm(request(f));
  assert.equal(r.reviewRequired, true);
  assert.equal(
    r.sha256,
    createHash("sha256").update("actual candidate bytes").digest("hex"),
  );
  const row = f.calls.find((c) => c.insert).insert;
  assert.equal(row.asset_role, "reference");
  assert.equal(row.generated_by, "manual");
  assert.equal(row.lesson_id, lessonId);
  assert.equal(f.calls.filter((c) => c.table === "course_lessons").length, 1);
  assert.equal(
    f.calls.some((c) =>
      ["video_jobs", "ultimate_build_jobs", "course_lessons_update"].includes(
        c.table,
      ),
    ),
    false,
  );
});
test("a mismatched course and lesson is rejected before any asset upload", async () => {
  const f = fixture({ missing: true });
  await assert.rejects(storeManualLessonFilm(request(f)), /COURSE_MISMATCH/);
  assert.equal(
    f.calls.some((c) => c.upload || c.insert),
    false,
  );
});
test("failed external storage cannot create a playable or approved media record", async () => {
  const f = fixture({ uploadFailure: true });
  await assert.rejects(storeManualLessonFilm(request(f)), /STORAGE_FAILED/);
  assert.equal(
    f.calls.some((c) => c.insert),
    false,
  );
});
test("an indexing failure preserves the uploaded film and reports its recovery identity", async () => {
  const f = fixture({ indexFailure: true });
  await assert.rejects(
    storeManualLessonFilm(request(f)),
    /INDEX_FAILED_ASSET_RETAINED:course-videos\/manual-lessons\//,
  );
  assert.equal(
    f.calls.some((c) => c.upload),
    true,
  );
});
test("invalid MIME or transport size cannot upload a file", async () => {
  const f = fixture();
  await assert.rejects(
    storeManualLessonFilm({ ...request(f), contentType: "text/plain" }),
    /FILE_INVALID/,
  );
  await assert.rejects(
    storeManualLessonFilm({
      ...request(f),
      bytes: { length: MAX_MANUAL_LESSON_BYTES + 1 },
    }),
    /FILE_INVALID/,
  );
  assert.equal(
    f.calls.some((c) => c.upload),
    false,
  );
});

const route = stripTypeScriptTypes(
  readFileSync(
    new URL(
      "../../apps/admin/app/api/admin/videos/upload/route.ts",
      import.meta.url,
    ),
    "utf8",
  ),
  { mode: "transform" },
)
  .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, "")
  .replace(/^export /gm, "");
function api(f, { provider = "backblaze-b2" } = {}) {
  const values = {
    NextResponse: Response,
    logAdminAudit: async () => f.calls.push({ audit: true }),
    AdminAction: { VIDEO_UPLOADED: "uploaded" },
    withAuth: (handler) => (request) =>
      handler(request, { id: "existing-admin" }),
    toErrorMessage: (e) => e.message,
    withApiAudit: (_path, handler) => handler,
    applyRateLimit: async () => null,
    requireAdminClient: async () => f.db,
    queueCourseMedia: () =>
      assert.fail("Manual upload must not invoke Course Factory"),
    attachLicensedMediaUpload: () =>
      assert.fail("Manual upload must not invoke licensed scene generation"),
    storeManualLessonFilm,
    MAX_MANUAL_LESSON_BYTES,
    uploadToElevateMedia: f.upload,
    getSignedElevateMediaUrl: f.sign,
    getElevateMediaStorageConfig: () => ({
      provider,
      endpoint:
        provider === "supabase-s3"
          ? "https://project.supabase.co"
          : "https://private-media.example",
    }),
  };
  return new Function(...Object.keys(values), route + ";return POST;")(
    ...Object.values(values),
  );
}
function form({ includeCourse = true } = {}) {
  const data = new FormData();
  data.set(
    "file",
    new File(["completed film"], "lesson.mp4", { type: "video/mp4" }),
  );
  data.set("title", "Reviewed orientation");
  if (includeCourse) data.set("courseId", courseId);
  data.set("lessonId", lessonId);
  data.set("completedLesson", "true");
  return new Request("https://admin.example/api/admin/videos/upload", {
    method: "POST",
    body: data,
  });
}
test("the actual authenticated multipart route reaches manual storage and returns review pending", async () => {
  const f = fixture();
  const response = await api(f)(form());
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.reviewRequired, true);
  assert.equal(payload.success, true);
  assert.equal(
    f.calls.some((c) => c.audit),
    true,
  );
});
test("the multipart route rejects missing course identity without a storage request", async () => {
  const f = fixture();
  const response = await api(f)(form({ includeCourse: false }));
  assert.equal(response.status, 400);
  assert.equal(
    f.calls.some((c) => c.upload),
    false,
  );
});
test("the multipart route cannot reroute a course film into Supabase storage", async () => {
  const f = fixture();
  const response = await api(f, { provider: "supabase-s3" })(form());
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /EXTERNAL_STORAGE_REQUIRED/);
  assert.equal(
    f.calls.some((c) => c.upload),
    false,
  );
});
