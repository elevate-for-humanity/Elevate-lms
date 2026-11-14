import {describe,it,expect} from 'vitest';
import {browserToolResponse} from '@/lib/devstudio/browser-tool-response';
const stream=(events:unknown[])=>new Response(events.map(event=>'data: '+JSON.stringify(event)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
describe('governed browser execution receipts',()=>{
 it('requires a terminal completion with both durable task and browser identity',async()=>{
  const result=await browserToolResponse(stream([{type:'status'},{type:'done',ok:true,taskId:'task',sessionId:'browser',output:'Observed page'}]));
  expect(await result.json()).toMatchObject({ok:true,status:'completed',verified:true,taskId:'task',sessionId:'browser'});
 });
 it.each([
  [{type:'step',message:'Working'}],
  [{type:'done',ok:true,taskId:'task'}],
  [{type:'error',error:'Navigation failed'}],
  [{type:'authentication_required',message:'Sign in required'}],
 ])('does not turn progress, partial results or blockers into success',async event=>{
  const result=await browserToolResponse(stream([event]));
  expect(result.ok).toBe(false);
  expect(await result.json()).toMatchObject({ok:false,status:'blocked'});
 });
});
