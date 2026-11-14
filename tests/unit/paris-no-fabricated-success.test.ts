import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ chat: vi.fn(), execute: vi.fn(), images: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: mocks.chat, aiGenerateImage: mocks.images }));
vi.mock('@/lib/ai/runtime/command-executor', () => ({ executeAICommand: mocks.execute }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({}) }));
import { ParisAI } from '@/lib/ai/paris-ai';
import { generateImage, editImage, generateAltText, optimizeImage } from '@/lib/paris/media-studio/api';
import { generateSupabaseEdgeFunction } from '@/lib/paris/import-engine/api-importer';

beforeEach(() => vi.resetAllMocks());
it('propagates provider failures and rejects empty completions', async () => {
  const ai = new ParisAI();
  mocks.chat.mockRejectedValueOnce(new Error('provider down'));
  await expect(ai.sendMessage([{role: 'user', content: 'hire an agent'}])).rejects.toThrow('provider down');
  mocks.chat.mockResolvedValueOnce({content: '  '});
  await expect(ai.sendMessage([{role: 'user', content: 'publish'}])).rejects.toThrow('PARIS_AI_EMPTY_RESPONSE');
});
it('cannot turn model prose or missing execution authority into command success', async () => {
  const ai = new ParisAI();
  expect((await ai.executeCommand('publish')).success).toBe(false);
  expect(mocks.chat).not.toHaveBeenCalled();
  expect(mocks.execute).not.toHaveBeenCalled();
  const context = {actorId: 'actor', actorRoles: ['admin'], adminOrigin: 'https://admin.example.test'};
  for (const status of ['advisory', 'running', 'approval_required', 'failed']) {
    mocks.execute.mockResolvedValueOnce({ok: true, executed: status === 'running', status, message: status});
    expect((await ai.executeCommand('publish', context)).success).toBe(false);
  }
  mocks.execute.mockResolvedValueOnce({ok: true, executed: true, status: 'completed', tool: 'programs.list', message: 'loaded', payload: []});
  expect(await ai.executeCommand('list programs', context)).toMatchObject({success: true, actions: ['programs.list']});
});
it('uses actual image provider output and never returns a stock fallback', async () => {
  mocks.images.mockResolvedValueOnce([{url: 'https://assets.example.test/generated.png'}]);
  expect(await generateImage({prompt: 'A classroom', type: 'hero'})).toEqual({success: true, imageUrl: 'https://assets.example.test/generated.png'});
  expect(mocks.images).toHaveBeenCalledWith(expect.objectContaining({prompt: 'A classroom'}));
  mocks.images.mockResolvedValueOnce([]);
  expect(await generateImage({prompt: 'A classroom', type: 'hero'})).toMatchObject({success: false});
  mocks.images.mockRejectedValueOnce(new Error('image provider down'));
  expect(await generateImage({prompt: 'A classroom', type: 'hero'})).toMatchObject({success: false, error: 'image provider down'});
});
it('never reports unperformed edits, descriptions, or URL-only optimization as success', async () => {
  for (const action of ['remove_background', 'upscale', 'crop'] as const)
    expect(await editImage('https://assets.example.test/source.png', {action, parameters: {}})).toMatchObject({success: false});
  await expect(generateAltText('https://assets.example.test/source.png')).rejects.toThrow('IMAGE_SOURCE_NOT_ALLOWED');
  await expect(optimizeImage('https://assets.example.test/source.png', {width: 80})).rejects.toThrow('IMAGE_SOURCE_NOT_ALLOWED');
});
it('generated endpoint scaffolds return HTTP 501 instead of pretending to execute', async () => {
  const source = generateSupabaseEdgeFunction({method: 'POST', path: '/orders', responses: [], security: []}, 'unused');
  let handler: (request: Request) => Promise<Response>;
  const runnable = source.replace(/^import .*$/gm, '');
  new Function('serve', 'createClient', 'Deno', runnable)(
    (value: typeof handler) => { handler = value; },
    () => ({auth: {getUser: async () => ({data: {user: {id: 'actor'}}})}}),
    {env: {get: () => 'test'}},
  );
  const response = await handler!(new Request('https://endpoint.example.test', {method: 'POST', body: '{}'}));
  expect(response.status).toBe(501);
  expect(await response.json()).toMatchObject({success: false, error: 'ENDPOINT_HANDLER_NOT_IMPLEMENTED'});
});
