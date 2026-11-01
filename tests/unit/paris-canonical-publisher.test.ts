import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ facebook: vi.fn(), instagram: vi.fn(), select: vi.fn(), insert: vi.fn() }));
vi.mock('@/lib/social/blog-social-pipeline', () => ({
  publishFacebookPageLink: mocks.facebook, publishFacebookPageReel: mocks.facebook,
  publishInstagramImage: mocks.instagram, publishInstagramReel: mocks.instagram,
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: () => ({ insert: mocks.insert, select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.select }) }) }) }),
}) }));
import { publishContent, getPostMetrics, schedulePost } from '@/lib/social/publisher';
import type { GeneratedContent } from '@/lib/paris/marketing/types';
const content: GeneratedContent = { id: '11111111-1111-4111-8111-111111111111', type: 'post', platform: ['facebook'], text: 'Authorized test content', hashtags: [], word_count: 3 };
beforeEach(() => { vi.clearAllMocks(); mocks.insert.mockResolvedValue({ error: null }); });
describe('PARIS uses real publishing capabilities', () => {
  it('requires the provider acknowledgement rather than inventing a post URL', async () => {
    mocks.facebook.mockResolvedValue({ postId: 'actual-id', publishedUrl: 'https://www.facebook.com/actual-id' });
    expect(await publishContent(content, 'facebook')).toMatchObject({ success: true, postId: 'actual-id' });
    expect(mocks.facebook).toHaveBeenCalledOnce();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ post_id: 'actual-id' }));
  });
  it('does not report success or write publication records on provider failure', async () => {
    mocks.facebook.mockRejectedValue(new Error('ACCOUNT_NOT_CONNECTED'));
    expect(await publishContent(content, 'facebook')).toMatchObject({ success: false, error: 'ACCOUNT_NOT_CONNECTED' });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('does not fabricate metrics when no provider observations are stored', async () => {
    mocks.select.mockResolvedValue({ data: null, error: null });
    expect(await getPostMetrics('post', 'facebook')).toBeNull();
  });
  it('does not acknowledge a schedule that failed database persistence', async () => {
    mocks.insert.mockResolvedValue({ error: new Error('DATABASE_OFFLINE') });
    await expect(schedulePost(content, 'facebook', '2027-01-01T12:00:00Z')).rejects.toThrow('DATABASE_OFFLINE');
  });
});
