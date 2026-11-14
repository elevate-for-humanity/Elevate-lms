import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/ai/ai-service', () => ({ aiChat: vi.fn() }));
import { findAcquisitionBrowserCheckpoint } from '@/lib/devstudio/browser-acquisition-checkpoint';
describe('owned acquisition checkpoint recovery', () => {
  it('reuses the exact command and preserves owner, run, tool and status scope', async () => {
    const filters: unknown[] = [];
    const saved = { id: 'saved', tool_name: 'browser.execute', tool_input: { task: 'Acquire media', sessionId: 'old-session' } };
    const query: any = {
      select: () => query,
      eq: (...args: unknown[]) => { filters.push(args); return query; },
      in: (...args: unknown[]) => { filters.push(args); return query; },
      order: () => query,
      limit: async () => ({data: [{...saved,id:'wrong',tool_input:{task:'Different command'}},saved],error:null}),
    };
    const db: any = { from: () => query };
    expect(await findAcquisitionBrowserCheckpoint(db,'owner','run','Acquire media')).toEqual(saved);
    expect(filters).toContainEqual(['requested_by','owner']);
    expect(filters).toContainEqual(['studio_run_id','run']);
    expect(filters).toContainEqual(['tool_name','browser.execute']);
    expect(filters).toContainEqual(['status',['queued','running','failed','awaiting_approval']]);
    expect(await findAcquisitionBrowserCheckpoint(db,'owner','run','Changed command')).toBeNull();
  });
  it('does not create a duplicate when checkpoint lookup fails', async () => {
    const query: any = {select:()=>query,eq:()=>query,in:()=>query,order:()=>query,
      limit:async()=>({data:null,error:new Error('database unavailable')})};
    await expect(findAcquisitionBrowserCheckpoint({from:()=>query} as any,'owner','run','task')).rejects.toThrow('database unavailable');
  });
});
