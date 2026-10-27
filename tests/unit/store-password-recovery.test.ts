// @vitest-environment node
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
const mocks=vi.hoisted(()=>({rateLimit:vi.fn(),generateLink:vi.fn(),email:vi.fn(),verify:vi.fn(),exchange:vi.fn()}));
vi.mock('@/lib/api/withRateLimit',()=>({applyRateLimit:mocks.rateLimit}));
vi.mock('@/lib/supabase/admin',()=>({requireAdminClient:async()=>({auth:{admin:{generateLink:mocks.generateLink}}})}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{verifyOtp:mocks.verify,exchangeCodeForSession:mocks.exchange}})}));
vi.mock('@/lib/email',()=>({sendEmail:mocks.email}));
import {POST} from '@/apps/marketing/app/api/auth/password-reset/route';
import {GET} from '@/apps/marketing/app/api/auth/recovery-callback/route';
beforeEach(()=>{vi.stubEnv('K_SERVICE','elevate-store-migration');mocks.rateLimit.mockResolvedValue(null);mocks.generateLink.mockResolvedValue({data:{properties:{hashed_token:'fixture-recovery-token'}},error:null});mocks.email.mockResolvedValue({success:true});mocks.verify.mockResolvedValue({error:null});mocks.exchange.mockResolvedValue({error:null});});
afterEach(()=>{vi.unstubAllEnvs();vi.resetAllMocks();});
function request(body:unknown){return new NextRequest('https://attacker.example/api/auth/password-reset',{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});}
it('issues Store recovery links using the fixed Store origin and never LMS',async()=>{
 const response=await POST(request({email:'Buyer@Example.com',portal:'program-holder'}));
 expect(response.status).toBe(200);expect(mocks.generateLink).toHaveBeenCalledWith({type:'recovery',email:'buyer@example.com'});
 const message=mocks.email.mock.calls[0][0];expect(message.text).toContain('https://store.elevateforhumanity.org/api/auth/recovery-callback?');
 expect(message.text).not.toContain('app.elevateforhumanity.org');expect(message.text).not.toContain('attacker.example');expect(message.text).not.toContain('program-holder');
});
it('does not disclose whether the address exists',async()=>{
 const known=await POST(request({email:'buyer@example.com'}));
 mocks.generateLink.mockResolvedValue({data:null,error:{message:'fixture missing account'}});
 const unknown=await POST(request({email:'absent@example.com'}));
 expect(await unknown.json()).toEqual(await known.json());expect(mocks.email).toHaveBeenCalledTimes(1);
});
it('rejects malformed email before creating a recovery credential',async()=>{
 expect((await POST(request({email:'invalid'}))).status).toBe(400);expect(mocks.generateLink).not.toHaveBeenCalled();
});
it('honors the reset rate limit before accessing customer accounts',async()=>{
 mocks.rateLimit.mockResolvedValue(new Response('{}',{status:429}));
 expect((await POST(request({email:'buyer@example.com'}))).status).toBe(429);expect(mocks.generateLink).not.toHaveBeenCalled();
});
it('verifies recovery once then stays on Store regardless of next or request host',async()=>{
 const response=await GET(new Request('https://attacker.example/api/auth/recovery-callback?token_hash=fixture-recovery-token&next=https://app.elevateforhumanity.org/admin'));
 expect(mocks.verify).toHaveBeenCalledWith({type:'recovery',token_hash:'fixture-recovery-token'});
 expect(response.headers.get('location')).toBe('https://store.elevateforhumanity.org/reset-password?mode=recovery');
});
it('failed recovery returns to Store login without forwarding the token',async()=>{
 mocks.verify.mockResolvedValue({error:Error('fixture failure')});
 const response=await GET(new Request('https://store.elevateforhumanity.org/api/auth/recovery-callback?token_hash=fixture-recovery-token'));
 expect(response.headers.get('location')).toBe('https://store.elevateforhumanity.org/login?error=recovery_failed');
});
