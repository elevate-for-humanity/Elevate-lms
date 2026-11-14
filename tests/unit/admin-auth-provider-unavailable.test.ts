// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
const state=vi.hoisted(()=>({getUser:vi.fn(),from:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:state.getUser},from:state.from})}));
import { apiAuthGuard } from '@/lib/admin/guards';
beforeEach(()=>{state.getUser.mockReset();state.from.mockReset();});
it.each([false,true])('reports retryable provider failure as503 with no authorized identity (throws=%s)',async(throws)=>{
 const error=new AuthRetryableFetchError('provider unavailable',429);
 if(throws)state.getUser.mockRejectedValue(error);else state.getUser.mockResolvedValue({data:{user:null},error});
 const result=await apiAuthGuard();expect(result.id).toBe('');expect(result.user).toBeNull();expect(result.effectiveRoles).toEqual([]);
 expect(result.error?.status).toBe(503);expect(result.error?.headers.get('Retry-After')).toBe('30');
 expect(await result.error?.json()).toMatchObject({error:'AUTH_PROVIDER_UNAVAILABLE'});expect(state.from).not.toHaveBeenCalled();
});
it('continues to reject a permanently invalid session',async()=>{
 state.getUser.mockResolvedValue({data:{user:null},error:new AuthApiError('Invalid refresh token',400,'refresh_token_not_found')});
 const result=await apiAuthGuard();expect(result.id).toBe('');expect(result.error?.status).toBe(401);expect(state.from).not.toHaveBeenCalled();
});
