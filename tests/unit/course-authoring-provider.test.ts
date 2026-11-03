// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@/lib/supabase';
import { aiChat, getActiveProviderName } from '@/lib/ai/ai-service';
import { executePaidInference, reservePaidInference, paidArtifactFingerprint } from '@/lib/ai/paid-inference-gateway';
import { createCourseAuthoringChat } from '@/lib/ultimate-course-builder/authoring/course-chat';

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: vi.fn(), getActiveProviderName: vi.fn() }));
vi.mock('@/lib/ai/paid-inference-gateway', () => ({
  executePaidInference: vi.fn(), reservePaidInference: vi.fn(), paidArtifactFingerprint: vi.fn(() => 'fingerprint'),
}));
const profile = { single: vi.fn(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis() };
const db = { from: vi.fn(() => profile) } as unknown as SupabaseClient;
const options = { model: 'gpt-4.1', messages: [{ role: 'user' as const, content: 'Preview a syllabus' }] };

beforeEach(() => {
  vi.clearAllMocks();
  profile.single.mockResolvedValue({ data: { tenant_id: 'test-tenant' }, error: null });
});

it('runs PARIS course authoring without a paid reservation or OpenAI model selection', async () => {
  vi.mocked(getActiveProviderName).mockReturnValue('elevate');
  vi.mocked(aiChat).mockResolvedValue({ content: 'owned response', model: 'owned-model' });
  const chat = await createCourseAuthoringChat(db, 'owner', 'course-draft');
  expect((await chat(options)).content).toBe('owned response');
  expect(aiChat).toHaveBeenCalledWith({ ...options, model: undefined, providerPolicy: 'owned-only' });
  expect(db.from).not.toHaveBeenCalled();
  expect(executePaidInference).not.toHaveBeenCalled();
});

it('preserves the OpenAI drafting fingerprint and stops before inference on budget denial', async () => {
  vi.mocked(getActiveProviderName).mockReturnValue('openai');
  vi.mocked(reservePaidInference).mockResolvedValue({ decision: 'budget_exceeded', requestId: null });
  vi.mocked(executePaidInference).mockImplementation(async ({ authorize }) => ({ decision: (await authorize()).decision }));
  const chat = await createCourseAuthoringChat(db, 'owner', 'course-draft');
  await expect(chat(options, 'existing-draft-hash')).rejects.toMatchObject({ decision: 'budget_exceeded', status: 402 });
  expect(reservePaidInference).toHaveBeenCalledWith(db, expect.objectContaining({
    provider: 'openai', model: 'gpt-4.1', scopeKey: 'tenant:test-tenant', idempotencyKey: 'course-draft:existing-draft-hash',
  }));
  expect(paidArtifactFingerprint).not.toHaveBeenCalled();
  expect(aiChat).not.toHaveBeenCalled();
});

it('fails closed when the configured model is unavailable', async () => {
  vi.mocked(getActiveProviderName).mockReturnValue('none');
  await expect(createCourseAuthoringChat(db, 'owner', 'course-ingestion')).rejects.toMatchObject({ status: 503 });
  expect(aiChat).not.toHaveBeenCalled();
  expect(executePaidInference).not.toHaveBeenCalled();
});
