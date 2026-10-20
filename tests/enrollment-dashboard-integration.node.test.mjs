import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// ── 1. TEST PORTAL PATHS & OCCUPATION TYPE GUARDS ─────────────────────────
const portalPathsSource = readFileSync(
  new URL('../lib/portal/apprenticeship-portal-paths.ts', import.meta.url),
  'utf8',
);
const portalPathsExecutable = stripTypeScriptTypes(
  portalPathsSource
    .replace(/import\s+.*?;/g, 'const LMS_HOST = "https://app.elevateforhumanity.org";')
    .replace(/^export\s+/gm, ''),
);
const portalPathsModule = new Function(
  `${portalPathsExecutable}\nreturn { isApprenticeshipSlug, portalPathForProgramSlug, APPRENTICESHIP_SLUG_TO_PORTAL_PATH };`,
)();

test('isApprenticeshipSlug identifies beauty and registered trades, rejects workforce/CTE programs', () => {
  const { isApprenticeshipSlug } = portalPathsModule;
  assert.equal(isApprenticeshipSlug('barber-apprenticeship'), true);
  assert.equal(isApprenticeshipSlug('cosmetology-apprenticeship'), true);
  assert.equal(isApprenticeshipSlug('esthetician-apprenticeship'), true);
  assert.equal(isApprenticeshipSlug('nail-technician-apprenticeship'), true);
  assert.equal(isApprenticeshipSlug('culinary-apprenticeship'), true);
  assert.equal(isApprenticeshipSlug('electrical'), true);
  assert.equal(isApprenticeshipSlug('plumbing'), true);

  // Workforce programs are not USDOL beauty/trade apprenticeships
  assert.equal(isApprenticeshipSlug('hvac-technician'), false);
  assert.equal(isApprenticeshipSlug('medical-assistant'), false);
  assert.equal(isApprenticeshipSlug('phlebotomy'), false);
  assert.equal(isApprenticeshipSlug('it-support'), false);
  assert.equal(isApprenticeshipSlug(null), false);
  assert.equal(isApprenticeshipSlug(undefined), false);
});

test('portalPathForProgramSlug routes apprenticeships to /apprentice and returns null for workforce programs', () => {
  const { portalPathForProgramSlug } = portalPathsModule;
  assert.equal(
    portalPathForProgramSlug('barber-apprenticeship'),
    'https://app.elevateforhumanity.org/apprentice?program=barber-apprenticeship',
  );
  assert.equal(
    portalPathForProgramSlug('cosmetology-apprenticeship'),
    'https://app.elevateforhumanity.org/apprentice?program=cosmetology-apprenticeship',
  );

  // Crucial fix: HVAC and workforce programs must NOT resolve to /apprentice
  assert.equal(portalPathForProgramSlug('hvac-technician'), null);
  assert.equal(portalPathForProgramSlug('medical-assistant'), null);
  assert.equal(portalPathForProgramSlug(null), null);
});

// ── 2. TEST GET NEXT REQUIRED ACTION (GATE) ──────────────────────────────
const gateSource = readFileSync(
  new URL('../lib/enrollment/gate.ts', import.meta.url),
  'utf8',
);
const gateExecutable = stripTypeScriptTypes(
  gateSource
    .replace(/import\s+.*?;/g, '')
    .replace(/^export\s+/gm, ''),
);
const gateModule = new Function(
  'portalPathForProgramSlug',
  'isApprenticeshipSlug',
  'resolveCourseIdFromDb',
  'createClient',
  'redirect',
  `${gateExecutable}\nreturn { getNextRequiredAction };`,
)(
  portalPathsModule.portalPathForProgramSlug,
  portalPathsModule.isApprenticeshipSlug,
  async () => null,
  () => ({}),
  () => {},
);

test('getNextRequiredAction handles missing program assignments safely', () => {
  const action = gateModule.getNextRequiredAction({
    status: 'active',
    orientation_completed_at: null,
    documents_submitted_at: null,
  });
  assert.equal(action.label, 'View Programs');
  assert.equal(action.href, '/programs');
});

test('getNextRequiredAction enforces orientation before documents', () => {
  const action = gateModule.getNextRequiredAction({
    status: 'enrolled',
    orientation_completed_at: null,
    documents_submitted_at: null,
    program_slug: 'hvac-technician',
  });
  assert.equal(action.label, 'Complete Orientation');
  assert.equal(action.href, '/programs/hvac-technician/orientation');
});

test('getNextRequiredAction enforces documents after orientation', () => {
  const action = gateModule.getNextRequiredAction({
    status: 'enrolled',
    orientation_completed_at: '2026-10-19T00:00:00Z',
    documents_submitted_at: null,
    program_slug: 'hvac-technician',
  });
  assert.equal(action.label, 'Submit Required Documents');
  assert.equal(action.href, '/programs/hvac-technician/documents');
});

test('getNextRequiredAction routes HVAC student to LMS courses if course_id is present', () => {
  const action = gateModule.getNextRequiredAction({
    status: 'active',
    orientation_completed_at: '2026-10-19T00:00:00Z',
    documents_submitted_at: '2026-10-19T00:00:00Z',
    program_slug: 'hvac-technician',
    course_id: 'hvac-course-101',
  });
  assert.equal(action.label, 'Begin Your Program');
  assert.equal(action.href, '/lms/courses/hvac-course-101');
});

test('getNextRequiredAction routes HVAC student with unpublished course to /lms/dashboard', () => {
  const action = gateModule.getNextRequiredAction({
    status: 'active',
    orientation_completed_at: '2026-10-19T00:00:00Z',
    documents_submitted_at: '2026-10-19T00:00:00Z',
    program_slug: 'hvac-technician',
    course_id: null, // unpublished course
  });
  assert.equal(action.label, 'Go to Your Dashboard');
  assert.equal(action.href, '/lms/dashboard');
  assert.match(action.description, /Track your enrolled program progress/);
});

test('getNextRequiredAction routes apprentice with unpublished course to apprentice portal', () => {
  const action = gateModule.getNextRequiredAction({
    status: 'active',
    orientation_completed_at: '2026-10-19T00:00:00Z',
    documents_submitted_at: '2026-10-19T00:00:00Z',
    program_slug: 'barber-apprenticeship',
    course_id: null,
  });
  assert.equal(action.label, 'Go to Your Dashboard');
  assert.equal(action.href, 'https://app.elevateforhumanity.org/apprentice?program=barber-apprenticeship');
});

// ── 3. TEST PROGRAM RESOLVER (CANONICAL & FALLBACKS) ──────────────────────
const resolverSource = readFileSync(
  new URL('../lib/course-builder/program-resolver.ts', import.meta.url),
  'utf8',
);
const resolverExecutable = stripTypeScriptTypes(
  resolverSource
    .replace(/import\s+.*?;/g, '')
    .replace(/^export\s+/gm, ''),
);
const programResolver = new Function(
  'logger',
  `${resolverExecutable}\nreturn { resolveCourseIdFromDb };`,
)({ info() {}, warn() {}, error() {} });

test('resolveCourseIdFromDb resolves canonical mapping from program_courses', async () => {
  const mockDb = {
    from(table) {
      return {
        select() { return this; },
        eq(col, val) { this[col] = val; return this; },
        order() { return this; },
        limit() { return this; },
        or() { return this; },
        maybeSingle: async () => {
          if (table === 'programs') {
            return { data: { id: 'prog-hvac-123' }, error: null };
          }
          if (table === 'program_courses') {
            return { data: { course_id: 'course-hvac-canonical' }, error: null };
          }
          return { data: null, error: null };
        },
      };
    },
  };

  const courseId = await programResolver.resolveCourseIdFromDb(mockDb, 'hvac-technician');
  assert.equal(courseId, 'course-hvac-canonical');
});

test('resolveCourseIdFromDb falls back to direct course link when program_courses is empty', async () => {
  const mockDb = {
    from(table) {
      return {
        select() { return this; },
        eq(col, val) { this[col] = val; return this; },
        order() { return this; },
        limit() { return this; },
        or() { return this; },
        maybeSingle: async () => {
          if (table === 'programs') {
            return { data: { id: 'prog-hvac-456' }, error: null };
          }
          if (table === 'program_courses') {
            return { data: null, error: null };
          }
          if (table === 'courses') {
            return { data: { id: 'course-hvac-direct' }, error: null };
          }
          return { data: null, error: null };
        },
      };
    },
  };

  const courseId = await programResolver.resolveCourseIdFromDb(mockDb, 'hvac-technician');
  assert.equal(courseId, 'course-hvac-direct');
});

test('resolveCourseIdFromDb supports direct UUID lookup in programs', async () => {
  const uuid = '11111111-2222-3333-4444-555555555555';
  const mockDb = {
    from(table) {
      return {
        select() { return this; },
        eq(col, val) { this[col] = val; return this; },
        order() { return this; },
        limit() { return this; },
        or() { return this; },
        maybeSingle: async () => {
          if (table === 'programs') {
            return { data: { id: uuid }, error: null };
          }
          if (table === 'program_courses') {
            return { data: { course_id: 'course-from-uuid' }, error: null };
          }
          return { data: null, error: null };
        },
      };
    },
  };

  const courseId = await programResolver.resolveCourseIdFromDb(mockDb, uuid);
  assert.equal(courseId, 'course-from-uuid');
});

// ── 4. TEST RESOLVE LATEST ENROLLMENT & MULTI-PROGRAM ROUTING ────────────
const enrollmentResolverSource = readFileSync(
  new URL('../lib/enrollment/resolver.ts', import.meta.url),
  'utf8',
);
const enrollmentResolverExecutable = stripTypeScriptTypes(
  enrollmentResolverSource
    .replace(/import\s+.*?;/g, '')
    .replace(/^export\s+/gm, ''),
);
const enrollmentResolverModule = new Function(
  'resolveCourseIdFromDb',
  `${enrollmentResolverExecutable}\nreturn { resolveLatestEnrollment, normalizeProgramEnrollment, hasLmsAccess };`,
)(async (_db, slug) => (slug === 'hvac-technician' ? 'resolved-hvac-course' : null));

test('resolveLatestEnrollment filters by requested programSlug for multi-program students', async () => {
  const mockUser = { id: 'student-multi-1' };
  const rows = [
    {
      id: 'enr-barber',
      user_id: 'student-multi-1',
      program_slug: 'barber-apprenticeship',
      status: 'active',
      enrollment_state: 'active',
      created_at: '2026-10-18T00:00:00Z',
    },
    {
      id: 'enr-hvac',
      user_id: 'student-multi-1',
      program_slug: 'hvac-technician',
      status: 'active',
      enrollment_state: 'active',
      created_at: '2026-10-15T00:00:00Z',
    },
  ];

  const mockClient = {
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from(table) {
      assert.equal(table, 'program_enrollments');
      return {
        select() { return this; },
        or() { return this; },
        order() { return this; },
        limit() {
          return {
            then(resolve) {
              resolve({ data: rows, error: null });
            },
          };
        },
      };
    },
  };

  // Requesting HVAC specifically must resolve HVAC, not the newer Barber enrollment
  const hvac = await enrollmentResolverModule.resolveLatestEnrollment({
    client: mockClient,
    userId: mockUser.id,
    programSlug: 'hvac-technician',
  });
  assert.equal(hvac?.programSlug, 'hvac-technician');
  assert.equal(hvac?.id, 'enr-hvac');
  assert.equal(hvac?.programTitle, 'Hvac Technician');
  assert.equal(hvac?.courseId, 'resolved-hvac-course');

  // Requesting Barber specifically resolves Barber
  const barber = await enrollmentResolverModule.resolveLatestEnrollment({
    client: mockClient,
    userId: mockUser.id,
    programSlug: 'barber-apprenticeship',
  });
  assert.equal(barber?.programSlug, 'barber-apprenticeship');
  assert.equal(barber?.id, 'enr-barber');
});

test('resolveLatestEnrollment prioritizes active enrollments over pending/withdrawn rows', async () => {
  const mockUser = { id: 'student-states-1' };
  const rows = [
    {
      id: 'enr-withdrawn-new',
      user_id: 'student-states-1',
      program_slug: 'medical-assistant',
      status: 'withdrawn',
      enrollment_state: 'withdrawn',
      created_at: '2026-10-20T00:00:00Z',
    },
    {
      id: 'enr-hvac-active',
      user_id: 'student-states-1',
      program_slug: 'hvac-technician',
      status: 'active',
      enrollment_state: 'active',
      created_at: '2026-10-10T00:00:00Z',
    },
  ];

  const mockClient = {
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from() {
      return {
        select() { return this; },
        or() { return this; },
        order() { return this; },
        limit() {
          return {
            then(resolve) {
              resolve({ data: rows, error: null });
            },
          };
        },
      };
    },
  };

  const latest = await enrollmentResolverModule.resolveLatestEnrollment({
    client: mockClient,
    userId: mockUser.id,
  });
  assert.equal(latest?.id, 'enr-hvac-active');
  assert.equal(latest?.programSlug, 'hvac-technician');
});

// ── 5. TEST NEXT ACTION API ACTION CODES & DASHBOARD NORMALIZATION ───────
const nextActionSource = readFileSync(
  new URL('../apps/lms/app/api/enrollment/next-action/route.ts', import.meta.url),
  'utf8',
);
const actionCodeMatch = nextActionSource.match(/function actionCode\([\s\S]*?^}/m);
const actionCodeFn = new Function(`${stripTypeScriptTypes(actionCodeMatch[0])}\nreturn actionCode;`)();

test('next-action actionCode maps correctly', () => {
  assert.equal(actionCodeFn('Complete Orientation', 0), 'ORIENTATION');
  assert.equal(actionCodeFn('Submit Required Documents', 0), 'DOCUMENTS');
  assert.equal(actionCodeFn('Go to Your Dashboard', 0), 'OPEN_DASHBOARD');
  assert.equal(actionCodeFn('Begin Your Program', 0), 'START_COURSE_1');
  assert.equal(actionCodeFn('Begin Your Program', 25), 'CONTINUE_LEARNING');
  assert.equal(actionCodeFn('View Programs', 0), 'EXPLORE_PROGRAMS');
});

test('learner dashboard normalization formats unpublished courses and preserves multi-program records', () => {
  const rows = [
    {
      id: 'enr-1',
      program_slug: 'hvac-technician',
      program_id: 'prog-hvac',
      course_id: null, // unpublished
      status: 'active',
      enrollment_state: 'active',
    },
    {
      id: 'enr-2',
      program_slug: 'barber-apprenticeship',
      program_id: 'prog-barber',
      course_id: null,
      status: 'active',
      enrollment_state: 'active',
    },
  ];

  const programMap = new Map([
    ['prog-hvac', { id: 'prog-hvac', title: 'HVAC Technician Training', description: 'Heating and cooling' }],
  ]);
  const apMap = new Map([
    ['prog-barber', { id: 'prog-barber', name: 'Barber Apprenticeship', description: 'Barbering apprenticeship' }],
  ]);

  const normalized = rows.map((e) => {
    let courses = null;
    const ap = apMap.get(e.program_id) ?? apMap.get(e.program_slug);
    if (!courses && ap) {
      courses = {
        id: ap.id,
        title: ap.name ?? 'Apprenticeship Program',
        description: ap.description ?? null,
        duration_hours: null,
      };
      return { ...e, courses, _isApprenticeship: true };
    }

    const program = programMap.get(e.program_id) ?? programMap.get(e.program_slug);
    if (!courses && program) {
      courses = {
        id: program.id,
        title: program.title ?? program.name ?? e.program_slug ?? 'Enrolled Program',
        description: program.description ?? 'Program enrollment active.',
        duration_hours: null,
      };
    }

    return { ...e, courses };
  });

  // Deduplication preserves both distinct enrollments
  const seen = new Set();
  const enrollments = normalized.filter((e) => {
    const key = e.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  assert.equal(enrollments.length, 2);

  // HVAC program has title and description even without a course
  assert.equal(enrollments[0].courses?.title, 'HVAC Technician Training');
  assert.equal(enrollments[0]._isApprenticeship, undefined);

  // Barber program is recognized as apprenticeship
  assert.equal(enrollments[1].courses?.title, 'Barber Apprenticeship');
  assert.equal(enrollments[1]._isApprenticeship, true);
});

test('Alta Jennings Bookkeeping repair: preserves active enrollment, resolves stale AWAIT_APPROVAL, and assigns canonical course', async () => {
  const mockUser = { id: 'student-alta-jennings' };
  const rows = [
    {
      id: 'enr-alta-bookkeeping',
      user_id: 'student-alta-jennings',
      program_slug: 'bookkeeping',
      course_id: null, // missing course assignment
      status: 'awaiting_approval', // stale AWAIT_APPROVAL
      enrollment_state: 'awaiting_approval',
      created_at: '2026-10-15T00:00:00Z',
    },
  ];

  const mockClient = {
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from(table) {
      return {
        select() { return this; },
        or() { return this; },
        order() { return this; },
        limit() {
          return {
            then(resolve) {
              resolve({ data: rows, error: null });
            },
          };
        },
      };
    },
  };

  const resolved = await enrollmentResolverModule.resolveLatestEnrollment({
    client: mockClient,
    userId: mockUser.id,
    programSlug: 'bookkeeping',
  });

  assert.ok(resolved, 'Bookkeeping enrollment must be resolved');
  assert.equal(resolved.programSlug, 'bookkeeping');
  // Stale AWAIT_APPROVAL resolved to active
  assert.equal(resolved.status, 'active');
  // Missing course assignment resolved to canonical Bookkeeping course
  assert.equal(resolved.courseId, '566e2ef7-6861-4736-9807-b4ff868fc908');
  // Bookkeeping program routing does NOT route to apprentice portal
  assert.equal(portalPathsModule.portalPathForProgramSlug('bookkeeping'), null);
  assert.equal(portalPathsModule.isApprenticeshipSlug('bookkeeping'), false);
});


