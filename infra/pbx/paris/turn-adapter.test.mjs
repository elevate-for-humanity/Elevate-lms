import test from 'node:test';
import assert from 'node:assert/strict';
import {pcm16ToUlaw,wavToUlaw,makeTurnHandler,callerRouteIntent,converse} from './turn-adapter.mjs';
function wav(samples){const b=Buffer.alloc(44+samples.length*2);b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);samples.forEach((s,i)=>b.writeInt16LE(s,44+i*2));return b;}
test('8 kHz 16-bit PCM WAV becomes packet-aligned PCMU',()=>{const out=wavToUlaw(wav(Array(200).fill(0)));assert.equal(out.length,320);assert.equal(out[0],0xff);assert.equal(out[319],0xff);});
test('rejects audio outside strict mono 8k format',()=>{const bad=wav(Array(160).fill(0));bad.writeUInt32LE(16000,24);assert.throws(()=>wavToUlaw(bad),/FORMAT/);});
test('PCMU silence is encoded predictably',()=>assert.equal(pcm16ToUlaw(0),0xff));
test('auth failures do not invoke AI functions',async()=>{let called=false;const handler=makeTurnHandler({token:'x'.repeat(40),stt:async()=>{called=true;}});const res={writeHead(code){this.code=code;},end(body){this.body=body;}};await handler({method:'POST',url:'/internal/paris/turn',headers:{authorization:'Bearer wrong'},async *[Symbol.asyncIterator](){yield Buffer.alloc(0);}},res);assert.equal(res.code,401);assert.equal(called,false);});
test('valid audio uses real processor interfaces and produces spoken audio',async()=>{const calls=[];const handler=makeTurnHandler({token:'x'.repeat(40),stt:async()=>{calls.push('stt');return 'What programs?';},llm:async history=>{calls.push('llm');assert.equal(history[0].role,'user');return 'Ask admissions about current programs.';},tts:async()=>{calls.push('tts');return Buffer.alloc(160,0xff).toString('base64');}});const payload={callId:'test-call-1',sessionId:'a'.repeat(24),sequence:0,encoding:'PCMU',sampleRate:8000,audioBase64:Buffer.alloc(160,0xff).toString('base64')};const res={writeHead(code){this.code=code;},end(body){this.body=body;}};await handler({method:'POST',url:'/internal/paris/turn',headers:{authorization:'Bearer '+'x'.repeat(40)},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(payload));}},res);assert.equal(res.code,200);assert.deepEqual(calls,['stt','llm','tts']);assert.equal(JSON.parse(res.body).endCall,false);});

test('only explicit caller speech requests operator transfer',async()=>{
  const {callerRouteIntent}=await import('./turn-adapter.mjs');
  assert.deepEqual(callerRouteIntent('Please connect me to the operator'),{type:'operator',extension:'0'});
  assert.equal(callerRouteIntent('How much is the barber course?'),null);
  assert.equal(callerRouteIntent('Transfer 18005551212'),null);
});

async function send(handler,payload){
 const res={writeHead(code){this.code=code;},end(body){this.body=JSON.parse(body);}};
 await handler({method:'POST',url:'/internal/paris/turn',headers:{authorization:'Bearer '+'x'.repeat(40)},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(payload));}},res);
 return res;
}
test('opening synthesizes configured business greeting without invented caller audio',async()=>{
 const spoken=[];const calls=[];const handler=makeTurnHandler({token:'x'.repeat(40),greeting:'Approved business greeting.',
  stt:async()=>{calls.push('stt');return 'What programs?';},llm:async()=>{calls.push('llm');return 'Admissions can confirm.';},tts:async text=>{spoken.push(text);return Buffer.alloc(160,255).toString('base64');}});
 const payload={callId:'greeting-call',sessionId:'e'.repeat(24),sequence:0,event:'greeting',encoding:'PCMU',sampleRate:8000};
 assert.equal((await send(handler,payload)).code,200);assert.deepEqual(calls,[]);assert.deepEqual(spoken,['Approved business greeting.']);
 assert.equal((await send(handler,payload)).code,409);
 const {event,...followup}=payload;
 assert.equal((await send(handler,{...followup,sequence:1,audioBase64:Buffer.alloc(160,255).toString('base64')})).code,200);
 assert.deepEqual(calls,['stt','llm']);
});
test('opening requires configured greeting and rejects synthetic audio or unknown events',async()=>{
 const handler=makeTurnHandler({token:'x'.repeat(40),greeting:'',tts:async()=>assert.fail('must not synthesize')});
 const payload={callId:'missing-greeting',sessionId:'f'.repeat(24),sequence:0,event:'greeting',encoding:'PCMU',sampleRate:8000};
 const missing=await send(handler,payload);assert.equal(missing.code,503);assert.equal(missing.body.error,'GREETING_NOT_CONFIGURED');
 assert.equal((await send(handler,{...payload,audioBase64:'AAAA'})).code,400);
 assert.equal((await send(handler,{...payload,event:'external-transfer'})).code,400);
});

test('explicit extension routing requires the reviewed allowlist',()=>{
 assert.deepEqual(callerRouteIntent('Please connect me to extension 123',{allowedExtensions:'123,456'}),{type:'extension',extension:'123'});
 assert.equal(callerRouteIntent('Please connect me to extension 999',{allowedExtensions:'123,456'}),null);
 assert.equal(callerRouteIntent('Please connect me to extension 123',{allowedExtensions:''}),null);
});

test('saved receptionist instructions reach the model while retaining base policy', async () => {
  let sent;
  await converse([{role:'user',text:'Hello'}], async (_url,body) => {
    sent=body;
    return {candidates:[{content:{parts:[{text:'Hello.'}]}}]};
  }, {env:{PARIS_SYSTEM_INSTRUCTIONS:'Ask which Elevate program the caller needs.'}});
  const text=sent.systemInstruction.parts[0].text;
  assert.match(text,/Never solicit SSNs/);
  assert.match(text,/Ask which Elevate program the caller needs/);
});
