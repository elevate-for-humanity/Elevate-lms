import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({from: () => ({select: () => ({eq: mocks.query})})}) }));
vi.mock('@/lib/social/publisher', () => ({}));
vi.mock('@/lib/paris/marketing/content-generator', () => ({}));
vi.mock('@/lib/paris/marketing/video-creator', () => ({}));
import { analyzeContentPerformance } from '@/lib/paris/marketing';
it('returns stored measurements without manufacturing a quality score', async () => {
  const measurements = [{platform: 'facebook', post_id: 'post', metrics: {impressions: 14}, updated_at: '2026-11-07'}];
  mocks.query.mockResolvedValueOnce({data: measurements, error: null});
  expect(await analyzeContentPerformance('content')).toEqual({score: null, metrics: measurements, strengths: [], improvements: [], recommendations: []});
});
it('distinguishes missing metrics and failed queries from measured performance', async () => {
  mocks.query.mockResolvedValueOnce({data: [{metrics: null}], error: null});
  await expect(analyzeContentPerformance('content')).rejects.toThrow('CONTENT_METRICS_UNAVAILABLE');
  mocks.query.mockResolvedValueOnce({data: null, error: new Error('database down')});
  await expect(analyzeContentPerformance('content')).rejects.toThrow('database down');
});
