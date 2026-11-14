import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { hashHiringToken } from '@/lib/tenant/hiring';

const mocks = vi.hoisted(() => ({ tenant: vi.fn(), admin: vi.fn(), session: vi.fn(), canManage: vi.fn(), access: vi.fn(), ai: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/tenant/resolve-public-tenant', () => ({ resolvePublishedTenantFromRequest: mocks.tenant }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.session }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: mocks.canManage }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: mocks.access }));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: mocks.ai }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn(async () => undefined) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
import { GET, POST } from '@/apps/marketing/app/api/tenant-sites/hiring/route';

const siteId = '00000000-0000-4000-8000-000000000001';
const applicationId = '00000000-0000-4000-8000-000000000002';
const token = 'a'.repeat(64);
const profile = { role: 'individual', name: 'Owner Test', email: 'owner@example.com', phone: '3175550100', company: '', serviceArea: 'Indianapolis', services: 'Janitorial', experience: 'Office cleaning', availability: 'Weekdays', capacity: 'One person', equipment: '', insurance: '', qualificationsNote: '' };
const data = () => ({ profile, interview: { messages: [], answered: 0, complete: false }, documents: [] });
function query(result: unknown) {
  const q = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(async () => result), single: vi.fn(async () => result), update: vi.fn(), insert: vi.fn() };
  q.select.mockReturnValue(q); q.eq.mockReturnValue(q); q.update.mockReturnValue(q); q.insert.mockReturnValue(q); return q;
}
function setup(row: Record<string, unknown> | null) {
  const website = query({ data: { site_name: 'Owner Test Cleaning', site_config: { meta: { hiringEnabled: true } } }, error: null });
  const lead = query({ data: row, error: null });
  const from = vi.fn((name: string) => name === 'user_websites' ? website : lead);
  mocks.admin.mockResolvedValue({ from });
  return { website, lead, from };
}
const request = (body: unknown) => new NextRequest('https://www.elevateforhumanity.org/api/tenant-sites/hiring', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Origin: 'https://www.elevateforhumanity.org' }, body: JSON.stringify(body) });
const row = (hiringData: unknown = data()) => ({ id: applicationId, hiring_data: hiringData, hiring_token_hash: hashHiringToken(token), hiring_version: 0, created_at: new Date().toISOString() });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tenant.mockResolvedValue({ websiteId: siteId, ownerUserId: 'owner', externalBackend: null, host: 'www.elevateforhumanity.org' });
  mocks.session.mockResolvedValue({ auth: { getUser: async () => ({ data: { user: { id: 'other-owner' } } }) } });
  mocks.access.mockResolvedValue({ allowed: true }); mocks.canManage.mockResolvedValue(false);
});
describe('tenant hiring API authorization and honest state transitions', () => {
  it('scopes an applicant capability to the resolved website, not a client supplied website', async () => {
    const db = setup(null);
    const response = await POST(request({ action: 'resume', id: applicationId, websiteId: 'other-site' }));
    expect(response.status).toBe(403);
    expect(db.lead.eq).toHaveBeenCalledWith('website_id', siteId);
    expect(db.lead.eq).toHaveBeenCalledWith('intake_type', 'hiring');
    expect(JSON.stringify(await response.json())).not.toContain('hiring_token_hash');
  });
  it('returns document names without exposing the storage object path to applicants', async () => {
    setup(row({ ...data(), documents: [{ id: '00000000-0000-4000-8000-000000000003', name: 'qualification.pdf', mime: 'application/pdf', bytes: 100, path: 'private/site/application/qualification.pdf' }] }));
    const response = await POST(request({ action: 'resume', id: applicationId }));
    expect(response.status).toBe(200);
    const result = JSON.stringify(await response.json());
    expect(result).toContain('qualification.pdf'); expect(result).not.toContain('private/site'); expect(result).not.toContain(hashHiringToken(token));
  });
  it('does not reveal files to an administrator of a different website', async () => {
    const db = setup(row());
    const response = await GET(new NextRequest(`https://www.elevateforhumanity.org/api/tenant-sites/hiring?websiteId=${siteId}&applicationId=${applicationId}&documentId=00000000-0000-4000-8000-000000000003`));
    expect(response.status).toBe(404); expect(mocks.canManage).toHaveBeenCalledWith(expect.anything(), siteId, 'other-owner');
    expect(db.from).not.toHaveBeenCalledWith('tenant_site_leads');
  });
  it('cannot sign a document path belonging to another tenant even if a stored record is edited', async () => {
    mocks.canManage.mockResolvedValue(true);
    setup(row({ ...data(), documents: [{ id: '00000000-0000-4000-8000-000000000003', name: 'qualification.pdf', mime: 'application/pdf', bytes: 100, path: 'another-site/private-application/qualification.pdf' }] }));
    const response = await GET(new NextRequest(`https://www.elevateforhumanity.org/api/tenant-sites/hiring?websiteId=${siteId}&applicationId=${applicationId}&documentId=00000000-0000-4000-8000-000000000003`));
    expect(response.status).toBe(404);
  });
  it('does not advance or save the interview when PARIS fails', async () => {
    const db = setup(row({ ...data(), assessment: { answers: {}, score: 50, reviewTopics: ['Safety'], completedAt: new Date().toISOString() }, interview: { messages: [{ role: 'PARIS', text: 'Describe your experience.' }], answered: 0, complete: false } }));
    mocks.ai.mockRejectedValueOnce(new Error('Provider unavailable'));
    const response = await POST(request({ action: 'interview', id: applicationId, version: 0, answer: 'I have cleaned offices and want to develop my skills.' }));
    expect(response.status).toBe(503); expect(db.lead.update).not.toHaveBeenCalled();
    expect(mocks.ai).toHaveBeenCalledWith(expect.objectContaining({ providerPolicy: 'owned-only' }));
  });
  it('rejects stale changes and direct submission before the assessment and interview', async () => {
    const db = setup(row());
    expect((await POST(request({ action: 'submit', id: applicationId, version: 0 }))).status).toBe(400);
    expect((await POST(request({ action: 'submit', id: applicationId, version: 9 }))).status).toBe(409);
    expect(db.lead.update).not.toHaveBeenCalled();
  });
});
