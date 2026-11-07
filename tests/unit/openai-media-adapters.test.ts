import {expect,it,vi,afterEach} from 'vitest';
const sdk=vi.hoisted(()=>({edit:vi.fn(),describe:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('openai',()=>({default:class{images={edit:sdk.edit};responses={create:sdk.describe};},toFile:async(bytes:Buffer)=>({bytes})}));
import {OpenAIProvider} from '@/lib/ai/providers/openai';
import {runWithPaidInferenceContext} from '@/lib/ai/paid-inference-context';
afterEach(()=>vi.unstubAllEnvs());
it('requires the existing paid-dispatch authorization before editing or describing',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-provider-key');
 const provider=new OpenAIProvider();
 await expect(provider.editImage({bytes:Buffer.from('source'),mime:'image/png',prompt:'edit'})).rejects.toThrow('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
 await expect(provider.describeImage('data:image/png;base64,AAAA')).rejects.toThrow('PAID_INFERENCE_AUTHORIZATION_REQUIRED');
 expect(sdk.edit).not.toHaveBeenCalled();expect(sdk.describe).not.toHaveBeenCalled();
});
it('returns real provider output and sends source pixels instead of a text-only prompt',async()=>{
 vi.stubEnv('OPENAI_API_KEY','test-only-provider-key');
 const provider=new OpenAIProvider();
 sdk.edit.mockResolvedValueOnce({data:[{b64_json:'actual-provider-output'}]});
 expect(await runWithPaidInferenceContext('approved-test',()=>provider.editImage({bytes:Buffer.from('source'),mime:'image/png',prompt:'remove background',transparent:true}))).toEqual([{b64Json:'actual-provider-output'}]);
 expect(sdk.edit).toHaveBeenCalledWith(expect.objectContaining({image:{bytes:Buffer.from('source')},background:'transparent'}),{timeout:120_000,maxRetries:0});
 sdk.describe.mockResolvedValueOnce({output_text:'A classroom.'});
 expect(await runWithPaidInferenceContext('approved-test',()=>provider.describeImage('data:image/png;base64,AAAA'))).toBe('A classroom.');
 expect(sdk.describe.mock.calls[0][0].input[0].content[1]).toMatchObject({type:'input_image',image_url:'data:image/png;base64,AAAA'});
});
