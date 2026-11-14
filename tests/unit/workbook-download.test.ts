import { beforeEach, expect, it, vi } from 'vitest';
const m=vi.hoisted(()=>({session:vi.fn(),admin:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:m.session}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:m.admin}));
import { GET } from '@/apps/lms/app/api/workbooks/[slug]/download/route';
beforeEach(()=>vi.clearAllMocks());
it('blocks source PDF downloads without reading session data or private storage',async()=>{
 const response=await GET();
 expect(response.status).toBe(403);
 expect(response.headers.get('cache-control')).toBe('private, no-store');
 expect(response.headers.get('x-content-type-options')).toBe('nosniff');
 expect(response.headers.get('content-type')).toContain('application/json');
 expect(await response.json()).toEqual({error:'Workbook PDF downloads are disabled. Open your workbook in the LMS to complete and save answers.'});
 expect(m.session).not.toHaveBeenCalled();
 expect(m.admin).not.toHaveBeenCalled();
});
