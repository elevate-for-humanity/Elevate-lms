import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  project: null as any,
  ownedProject: null as any,
  user: null as { id: string } | null,
  authError: null as any,
  results: {} as Record<string, { data: any; error: any }>,
  queries: [] as unknown[][],
  inserts: [] as { table: string; payload: any }[],
  savedDocument: { data: null, error: null } as { data: any; error: any },
  upload: vi.fn(),
  remove: vi.fn(),
  loadProject: vi.fn(),
  loadOwnedProject: vi.fn(),
  adminClient: vi.fn(),
}));

vi.mock('@/lib/agentic/project-service', () => ({
  loadAgenticProject: (...args: unknown[]) => { state.loadProject(...args); return state.project; },
  loadLatestAgenticProjectForUser: (...args: unknown[]) => { state.loadOwnedProject(...args); return state.ownedProject; },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user }, error: state.authError }) } }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => {
    state.adminClient();
    return {
      storage: { from: (bucket: string) => { expect(bucket).toBe('documents'); return { upload: state.upload, remove: state.remove }; } },
      from(table: string) {
        const query: any = {
          select: (columns: string) => { state.queries.push([table, 'select', columns]); return query; },
          eq: (...args: unknown[]) => { state.queries.push([table, 'eq', ...args]); return query; },
          is: (...args: unknown[]) => { state.queries.push([table, 'is', ...args]); return query; },
          or: (...args: unknown[]) => { state.queries.push([table, 'or', ...args]); return query; },
          order: (...args: unknown[]) => { state.queries.push([table, 'order', ...args]); return query; },
          insert: (payload: unknown) => { state.inserts.push({ table, payload }); return query; },
          single: async () => state.savedDocument,
          maybeSingle: async () => state.results[table],
          then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(state.results[table]).then(resolve, reject),
        };
        return query;
      },
    };
  },
}));

import { GET, POST } from '@/apps/marketing/app/api/paris/application-interview/documents/route';
import { parseApplicationSessionCookie } from '@/lib/paris/admissions/application-session-cookie';

const PROJECT_ID = 'c0b744df-ece9-40a3-90c1-f1c3ebf2d012';
const OWNER_PROJECT_ID = 'c0b744df-ece9-40a3-90c1-f1c3ebf2d013';
const RESUME_TOKEN = 'valid-opaque-resume-token-for-tests';

function request(cookie: boolean | string = true) {
  return new NextRequest('https://www.example.test/api/paris/application-interview/documents', {
    headers: cookie ? { cookie: `paris_application_resume=${typeof cookie === 'string' ? cookie : `${PROJECT_ID}.${RESUME_TOKEN}`}` } : {},
  });
}

function uploadRequest(cookie: boolean | string = true) {
  const file = new File(['%PDF test document'], 'photo-id.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF test document').buffer });
  const values: Record<string, unknown> = { file, documentType: 'photo_id', requirementId: '' };
  return { cookies: request(cookie).cookies, formData: async () => ({ get: (key: string) => values[key] }) } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.project = { id: PROJECT_ID, target_type: 'application', metadata: {} };
  state.ownedProject = null;
  state.user = null;
  state.authError = null;
  state.queries = [];
  state.inserts = [];
  state.upload.mockResolvedValue({ error: null });
  state.remove.mockResolvedValue({ error: null });
  state.savedDocument = { data: { id: 'saved-document', verified: false, status: 'pending' }, error: null };
  state.results = {
    documents: { data: [{ id: 'document', verified: false, status: 'pending' }], error: null },
    document_requirements: { data: [{ id: 'requirement', document_type: 'photo_id' }], error: null },
    programs: { data: { id: 'program-id' }, error: null },
    agentic_build_events: { data: null, error: null },
  };
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('PARIS application documents', () => {
  it('returns only the token-authorized application documents and applicable requirements', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ ok: true, documents: state.results.documents.data, requirements: state.results.document_requirements.data });
    expect(state.loadProject).toHaveBeenCalledWith({ projectId: PROJECT_ID, resumeToken: RESUME_TOKEN });
    expect(state.queries).toContainEqual(['documents', 'eq', 'owner_type', 'agentic_application']);
    expect(state.queries).toContainEqual(['documents', 'eq', 'owner_id', PROJECT_ID]);
    expect(state.queries).toContainEqual(['document_requirements', 'eq', 'role', 'student']);
    expect(state.queries).toContainEqual(['document_requirements', 'is', 'program_id', null]);
  });

  it('includes the selected program and shared requirements', async () => {
    state.project.metadata = { applicationInterviewState: { answers: { program: 'hvac-technician' } } };
    expect((await GET(request())).status).toBe(200);
    expect(state.queries).toContainEqual(['programs', 'eq', 'slug', 'hvac-technician']);
    expect(state.queries).toContainEqual(['document_requirements', 'or', 'program_id.is.null,program_id.eq.program-id']);
  });

  it('resumes documents for the verified signed-in owner on a new browser', async () => {
    state.user = { id: 'verified-owner' };
    state.ownedProject = { ...state.project, id: OWNER_PROJECT_ID };
    expect((await GET(request(false))).status).toBe(200);
    expect(state.loadProject).not.toHaveBeenCalled();
    expect(state.loadOwnedProject).toHaveBeenCalledWith({ userId: 'verified-owner', targetType: 'application' });
    expect(state.queries).toContainEqual(['documents', 'eq', 'owner_id', OWNER_PROJECT_ID]);
  });

  it('treats a malformed cookie as absent so the verified owner can still resume', async () => {
    state.user = { id: 'verified-owner' };
    state.ownedProject = { ...state.project, id: OWNER_PROJECT_ID };
    expect((await GET(request(`not-a-uuid.${RESUME_TOKEN}`))).status).toBe(200);
    expect(state.loadProject).not.toHaveBeenCalled();
    expect(state.queries).toContainEqual(['documents', 'eq', 'owner_id', OWNER_PROJECT_ID]);
  });

  it.each([undefined, '', 'without-separator', `not-a-uuid.${RESUME_TOKEN}`, `${PROJECT_ID}.`, `${PROJECT_ID}.${'x'.repeat(201)}`])('rejects malformed interview cookie %s before database lookup', (cookie) => {
    expect(parseApplicationSessionCookie(cookie)).toBeNull();
  });

  it('uploads an anonymous application document with project ownership and pending review', async () => {
    const response = await POST(uploadRequest());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, document: state.savedDocument.data });
    const uploadPath = state.upload.mock.calls[0][0];
    expect(uploadPath).toMatch(new RegExp(`^application-interviews/${PROJECT_ID}/[^/]+-photo-id\\.pdf$`));
    expect(state.inserts).toContainEqual({ table: 'documents', payload: expect.objectContaining({ user_id: null, owner_type: 'agentic_application', owner_id: PROJECT_ID, file_path: uploadPath, status: 'pending', verification_status: 'pending', verified: false }) });
    expect(state.remove).not.toHaveBeenCalled();
  });

  it('uploads resumed documents under the verified owner rather than a caller-supplied owner', async () => {
    state.user = { id: 'verified-owner' };
    state.ownedProject = { ...state.project, id: OWNER_PROJECT_ID, user_id: 'verified-owner' };
    expect((await POST(uploadRequest(false))).status).toBe(201);
    expect(state.inserts).toContainEqual({ table: 'documents', payload: expect.objectContaining({ user_id: 'verified-owner', owner_id: OWNER_PROJECT_ID, verified: false }) });
    expect(state.upload.mock.calls[0][0]).toContain(`application-interviews/${OWNER_PROJECT_ID}/`);
  });

  it('removes the uploaded object if document metadata cannot be saved', async () => {
    state.savedDocument = { data: null, error: { code: '42703', message: 'missing metadata column' } };
    const response = await POST(uploadRequest());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: 'Unable to upload application document' });
    expect(state.remove).toHaveBeenCalledWith([state.upload.mock.calls[0][0]]);
    expect(state.inserts.filter(({ table }) => table === 'agentic_build_events')).toEqual([]);
  });

  it.each([GET, POST])('rejects unverified callers before privileged document access', async (handler) => {
    state.project = null;
    state.user = { id: 'unverified-user' };
    state.authError = { message: 'Session not verified' };
    const response = await handler(request());
    expect(response.status).toBe(404);
    expect(state.loadOwnedProject).not.toHaveBeenCalled();
    expect(state.adminClient).not.toHaveBeenCalled();
  });

  it('rejects valid tokens for projects outside application intake', async () => {
    state.project.target_type = 'course';
    expect((await GET(request())).status).toBe(404);
    expect(state.adminClient).not.toHaveBeenCalled();
  });

  it.each(['documents', 'document_requirements', 'programs'])('fails visibly and logs safe structured diagnostics when %s cannot load', async (table) => {
    if (table === 'programs') state.project.metadata = { applicationInterviewState: { answers: { program: 'hvac-technician' } } };
    state.results[table] = { data: null, error: { code: '42703', message: `column ${table}.missing does not exist`, details: 'not sent to applicants', token: 'never log this token' } };
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: 'Unable to load application documents' });
    expect(console.error).toHaveBeenCalledWith('paris.application.documents.list.failed', JSON.stringify({ message: `column ${table}.missing does not exist`, code: '42703' }));
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain('never log this token');
  });
});
