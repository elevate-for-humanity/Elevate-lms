// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
const state=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn()}));
vi.mock('@/lib/supabase/middleware',()=>({hasSupabaseAuthCookie:()=>true,createMiddlewareSupabaseClient:()=>({auth:{getUser:state.getUser},from:state.from})}));
vi.mock('@/lib/api/admin-ip-guard',()=>({checkAdminIP:()=>null}));
import { middleware } from '@/apps/admin/middleware';
beforeEach(()=>{state.getUser.mockReset();state.from.mockReset();});
it.each(['/studio/repository','/api/admin/dev-studio/runtime'])('keeps transient provider failures out of login redirects for %s',async(path)=>{
 state.getUser.mockResolvedValue({data:{user:null},error:new AuthRetryableFetchError('rate limited',429)});
 const result=await middleware(new NextRequest('https://admin.elevateforhumanity.org'+path));
 expect(result.status).toBe(503);expect(result.headers.get('location')).toBeNull();expect(result.headers.get('Retry-After')).toBe('30');
 expect(result.headers.get('Cache-Control')).toContain('no-store');expect(result.headers.get('x-middleware-next')).toBeNull();
 expect(state.from).not.toHaveBeenCalled();
});
it.each(['/studio/repository','/api/admin/dev-studio/runtime'])('rejects permanently invalid sessions for %s',async(path)=>{
 state.getUser.mockResolvedValue({data:{user:null},error:new AuthApiError('invalid refresh',400,'refresh_token_not_found')});
 const result=await middleware(new NextRequest('https://admin.elevateforhumanity.org'+path));
 if(path.startsWith('/api/'))expect(result.status).toBe(401);else{expect(result.status).toBe(307);expect(result.headers.get('location')).toContain('/login?redirect=');}
 expect(state.from).not.toHaveBeenCalled();
});
