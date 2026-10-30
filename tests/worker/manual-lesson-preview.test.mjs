import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const source = stripTypeScriptTypes(
  readFileSync(
    new URL(
      "../../apps/admin/app/api/admin/videos/lesson-preview/route.ts",
      import.meta.url,
    ),
    "utf8",
  ),
  { mode: "transform" },
)
  .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\n/gm, "")
  .replace(/^export /gm, "");
const courseId = "e9a2547c-ae03-418e-97fc-51377d438f8c",
  lessonId = "c3aba828-774a-4c35-a592-7f1b9d85a6c2";
function fixture({ denied = false, missing = false, dbError = false } = {}) {
  const calls = [];
  const db = {
    from(table) {
      assert.equal(table, "course_lessons");
      calls.push(["read", table]);
      return {
        select() {
          return this;
        },
        eq(k, v) {
          calls.push([k, v]);
          return this;
        },
        async maybeSingle() {
          return {
            data: missing ? null : { id: lessonId },
            error: dbError ? Error("private detail") : null,
          };
        },
      };
    },
  };
  const values = {
    NextResponse: {
      json: (data, options) => Response.json(data, options),
      redirect: (url) =>
        new Response(null, { status: 307, headers: { location: String(url) } }),
    },
    applyRateLimit: async () => null,
    apiRequireAdmin: async () =>
      denied
        ? { error: new Response(null, { status: 403 }) }
        : { id: "authorized-admin" },
    requireAdminClient: async () => db,
    createPortalPreviewHandoff: (id, course) => {
      calls.push(["sign", id, course]);
      return "signed-read-only-handoff";
    },
  };
  return {
    calls,
    get: new Function(...Object.keys(values), source + ";return GET;")(
      ...Object.values(values),
    ),
  };
}
function request(c = courseId, l = lessonId) {
  return {
    nextUrl: new URL(
      "https://admin.example/api/admin/videos/lesson-preview?courseId=" +
        c +
        "&lessonId=" +
        l,
    ),
  };
}
test("native review rejects an unauthorized caller before reading or signing", async () => {
  const f = fixture({ denied: true });
  assert.equal((await f.get(request())).status, 403);
  assert.deepEqual(f.calls, []);
});
test("invalid identifiers cannot request a signed preview", async () => {
  const f = fixture();
  assert.equal((await f.get(request("not-a-uuid"))).status, 400);
  assert.deepEqual(f.calls, []);
});
test("a lesson outside the selected course cannot receive a preview handoff", async () => {
  const f = fixture({ missing: true });
  assert.equal((await f.get(request())).status, 404);
  assert.ok(f.calls.some((c) => c[0] === "course_id" && c[1] === courseId));
  assert.ok(!f.calls.some((c) => c[0] === "sign"));
});
test("authorized review redirects to the existing read-only LMS handoff without authoring writes", async () => {
  const f = fixture();
  const r = await f.get(request());
  assert.equal(r.status, 307);
  const u = new URL(r.headers.get("location"));
  assert.equal(u.pathname, "/api/admin/course-preview");
  assert.equal(u.searchParams.get("lessonId"), lessonId);
  assert.equal(u.searchParams.get("handoff"), "signed-read-only-handoff");
  assert.equal(r.headers.get("referrer-policy"), "no-referrer");
  assert.match(r.headers.get("cache-control"), /no-store/);
  assert.equal(f.calls.filter((c) => c[0] === "sign").length, 1);
});
test("database errors expose neither private details nor signed tokens", async () => {
  const f = fixture({ dbError: true });
  const r = await f.get(request());
  assert.equal(r.status, 503);
  assert.doesNotMatch(await r.text(), /private detail|signed-read-only/);
  assert.ok(!f.calls.some((c) => c[0] === "sign"));
});
