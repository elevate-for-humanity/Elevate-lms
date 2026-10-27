import { File as NodeFile } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({actor:vi.fn(),send:vi.fn()}));
vi.mock('@/lib/phone/actor-response',()=>({phoneActorResponse:mocks.actor}));
vi.mock('@/lib/phone/twilio',()=>({SMS_MEDIA_BUCKET:'communication-sms-media',sendTwilioMessage:mocks.send}));
import { smsPost } from '@/lib/phone/sms-api';
const id='11111111-1111-4111-8111-111111111111';
function setup(options:{preview?:boolean;prior?:{status:string}}={}) {
  const uploads=vi.fn(async()=>({error:null})),updates:any[]=[];
  const db={
    from:(table:string)=>{
      const chain:any={select:()=>chain,eq:()=>chain,order:()=>chain,limit:()=>chain,
        maybeSingle:async()=>({data:table==='phone_numbers'?{e164:'+14632401404',provider:'twilio',capabilities:{sms:true,mms:true}}:options.prior||null}),
        insert:()=>chain,single:async()=>({data:{id}}),update:(value:any)=>{updates.push(value);return chain;},
        then:(resolve:any)=>resolve({error:null})};
      return chain;
    },
    storage:{from:()=>({upload:uploads,createSignedUrl:async()=>({data:{signedUrl:'https://storage.example.test/expiring-picture'}})})},
  };
  mocks.actor.mockResolvedValue({actor:{system:{id:'system'},user:{id:'owner'},roles:['staff'],previewing:!!options.preview,db}});
  mocks.send.mockResolvedValue({messageId:'SM'+'a'.repeat(32)});
  return {uploads,updates};
}
function multipart(file:NodeFile) {
  const form=new Map<string,unknown>([['to','3175550100'],['body',''],['requestKey',id],['picture',file]]);
  return {headers:new Headers({'content-type':'multipart/form-data; boundary=test'}),formData:async()=>form} as unknown as Request;
}
beforeEach(()=>vi.clearAllMocks());
afterEach(()=>vi.unstubAllGlobals());
describe('private outbound picture delivery',()=>{
  it('uploads a supported picture privately and supplies only an expiring storage URL to Twilio',async()=>{
    const {uploads,updates}=setup();
    const picture=new NodeFile([Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==','base64')],'picture.gif',{type:'image/gif'});
    expect((await smsPost(multipart(picture))).status).toBe(200);
    expect(uploads.mock.calls[0][0]).toBe(`system/owner/${id}/picture`);
    expect(mocks.send).toHaveBeenCalledWith({from:'+14632401404',to:'+13175550100',body:'',mediaUrls:['https://storage.example.test/expiring-picture']});
    expect(updates.some(row=>row.media?.[0]?.kind==='storage')).toBe(true);
  });
  it('rejects a disguised file before storing or sending it',async()=>{
    const {uploads}=setup();
    const file=new NodeFile(['<svg onload="bad()"/>'],'picture.gif',{type:'image/gif'});
    expect((await smsPost(multipart(file))).status).toBe(400);
    expect(uploads).not.toHaveBeenCalled();expect(mocks.send).not.toHaveBeenCalled();
  });
  it('does not send or upload again for an accepted request key',async()=>{
    const {uploads}=setup({prior:{status:'accepted'}});
    const file=new NodeFile([Buffer.from('GIF89a')],'picture.gif',{type:'image/gif'});
    expect((await smsPost(multipart(file))).status).toBe(200);
    expect(uploads).not.toHaveBeenCalled();expect(mocks.send).not.toHaveBeenCalled();
  });
  it('prevents a preview session from sending pictures',async()=>{
    const {uploads}=setup({preview:true});
    const file=new NodeFile([Buffer.from('GIF89a')],'picture.gif',{type:'image/gif'});
    expect((await smsPost(multipart(file))).status).toBe(403);
    expect(uploads).not.toHaveBeenCalled();expect(mocks.send).not.toHaveBeenCalled();
  });
});
