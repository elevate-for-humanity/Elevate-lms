import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || '';
  if (!UUID.test(courseId)) {
    return NextResponse.json({ error: 'Valid courseId required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const [courseResult, modulesResult, lessonsResult] = await Promise.all([
    db
      .from('courses')
      .select('id,title,short_description,description,status,duration_hours,thumbnail_url')
      .eq('id', courseId)
      .maybeSingle(),
    db
      .from('course_modules')
      .select('id,title,description,order_index,is_published')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
    db
      .from('course_lessons')
      .select('id,module_id,title,duration_minutes,lesson_type,status,is_required,order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true }),
  ]);

  if (courseResult.error || modulesResult.error || lessonsResult.error) {
    return NextResponse.json(
      {
        error: 'Unable to load canonical course preview',
        details:
          courseResult.error?.message ||
          modulesResult.error?.message ||
          lessonsResult.error?.message,
      },
      { status: 500 },
    );
  }

  const course = courseResult.data;
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  const modules = modulesResult.data ?? [];
  const lessons = lessonsResult.data ?? [];
  const lessonsByModule = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const moduleLessons = lessonsByModule.get(lesson.module_id) ?? [];
    moduleLessons.push(lesson);
    lessonsByModule.set(lesson.module_id, moduleLessons);
  }

  const moduleMarkup = modules
    .map((module, moduleIndex) => {
      const moduleLessons = lessonsByModule.get(module.id) ?? [];
      const lessonMarkup = moduleLessons
        .map(
          (lesson, lessonIndex) => `
            <li>
              <span class="lesson-number">${moduleIndex + 1}.${lessonIndex + 1}</span>
              <span class="lesson-title">${escapeHtml(lesson.title)}</span>
              <span class="lesson-meta">${escapeHtml(lesson.lesson_type || 'lesson')} · ${Math.max(0, Number(lesson.duration_minutes) || 0)} min</span>
            </li>`,
        )
        .join('');

      return `
        <details class="module" ${moduleIndex === 0 ? 'open' : ''}>
          <summary>
            <span class="module-number">${moduleIndex + 1}</span>
            <span>
              <strong>${escapeHtml(module.title)}</strong>
              <small>${moduleLessons.length} lesson${moduleLessons.length === 1 ? '' : 's'}</small>
            </span>
          </summary>
          ${module.description ? `<p>${escapeHtml(module.description)}</p>` : ''}
          <ol>${lessonMarkup || '<li class="empty">No lessons authored yet.</li>'}</ol>
        </details>`;
    })
    .join('');

  const title = escapeHtml(course.title);
  const description = escapeHtml(course.short_description || course.description || '');
  const duration = Number(course.duration_hours) || 0;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — learner preview</title>
  <style>
    :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f8fafc;color:#0f172a}
    *{box-sizing:border-box}body{margin:0}.hero{padding:clamp(24px,5vw,52px);background:linear-gradient(135deg,#020617,#172554);color:white}
    .eyebrow{margin:0 0 10px;color:#93c5fd;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
    h1{margin:0;max-width:760px;font-size:clamp(28px,5vw,48px);line-height:1.05}.description{max-width:760px;margin:14px 0 0;color:#dbeafe;line-height:1.65}
    .facts{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.fact{padding:8px 12px;border:1px solid #ffffff2b;border-radius:999px;background:#ffffff12;font-size:13px;font-weight:700}
    main{max-width:900px;margin:0 auto;padding:clamp(18px,4vw,36px)}.notice{margin-bottom:18px;padding:14px 16px;border:1px solid #bfdbfe;border-radius:14px;background:#eff6ff;color:#1e3a8a;font-size:13px;line-height:1.5}
    .module{margin-bottom:12px;border:1px solid #e2e8f0;border-radius:16px;background:white;box-shadow:0 8px 24px #0f172a0a;overflow:hidden}
    summary{display:flex;align-items:center;gap:13px;padding:17px 18px;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}.module-number{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#dbeafe;color:#1d4ed8;font-weight:900}
    summary strong{display:block;font-size:15px}summary small{display:block;margin-top:3px;color:#64748b}.module>p{margin:0;padding:0 18px 14px 65px;color:#475569;font-size:14px;line-height:1.55}
    ol{margin:0;padding:0;border-top:1px solid #f1f5f9;list-style:none}li{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:10px;align-items:center;padding:13px 18px;border-top:1px solid #f8fafc;font-size:14px}
    .lesson-number{color:#64748b;font-variant-numeric:tabular-nums}.lesson-title{font-weight:650}.lesson-meta{color:#64748b;font-size:12px;text-transform:capitalize}.empty{display:block;color:#64748b}
    @media(max-width:560px){li{grid-template-columns:38px minmax(0,1fr)}.lesson-meta{grid-column:2}.module>p{padding-left:18px}}
  </style>
</head>
<body>
  <header class="hero">
    <p class="eyebrow">Live learner preview</p>
    <h1>${title}</h1>
    <p class="description">${description}</p>
    <div class="facts">
      <span class="fact">${modules.length} modules</span>
      <span class="fact">${lessons.length} lessons</span>
      <span class="fact">${duration.toFixed(1)} authored hours</span>
      <span class="fact">Status: ${escapeHtml(course.status)}</span>
    </div>
  </header>
  <main>
    <div class="notice">Preview uses the current canonical course records and updates after saved changes. Learner progress controls are intentionally disabled.</div>
    ${moduleMarkup || '<div class="notice">No modules have been authored for this course.</div>'}
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      // This authenticated HTML endpoint is intentionally embedded only by the
      // same-origin Course Studio. Override any inherited DENY header without
      // weakening framing policy for the rest of Admin.
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
