import test from 'node:test';
import assert from 'node:assert/strict';
import {menuOptions,menuRoute,openingText} from './menu.mjs';
import {handleDtmf} from './ari-media.mjs';
import {makeTurnHandler,callerRouteIntent} from './turn-adapter.mjs';

const entries=Array.from({length:8},(_,digit)=>({digit:String(digit),label:digit===0?'Administration':`Approved program ${digit}`,extension:digit===0?'0':String(100+digit)}));
const menu=JSON.stringify(entries),allowedExtensions='101,102,103,104,105,106,107';

test('opening reads every saved menu option in order without inventing a destination',async()=>{
  const spoken=[];
  const handler=makeTurnHandler({token:'x'.repeat(40),greeting:'Please listen for the person and program you need.',menu,allowedExtensions,
    stt:async()=>assert.fail('no caller audio'),llm:async()=>assert.fail('menu must not be generated'),tts:async text=>{spoken.push(text);return Buffer.alloc(160).toString('base64');}});
  const body={callId:'menu-greeting',sessionId:'1'.repeat(24),sequence:0,event:'greeting',encoding:'PCMU',sampleRate:8000};
  const response={writeHead(status){this.status=status;},end(){}};
  await handler({method:'POST',url:'/internal/paris/turn',headers:{authorization:'Bearer '+'x'.repeat(40)},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(body));}},response);
  assert.equal(response.status,200);
  assert.equal(spoken.length,1);
  for(const entry of entries)assert.ok(spoken[0].includes(`For ${entry.label}, press ${entry.digit}.`));
  assert.ok(spoken[0].indexOf('press 1.')<spoken[0].indexOf('press 7.'));
});

test('each announced keypad choice interrupts the opening and transfers only to its saved extension',async()=>{
  for(const entry of entries){
    const session={callId:'owned-caller',playing:true,busy:true,frames:[]};
    const calls=[];
    const deps={menu,allowedExtensions,route:async(...args)=>calls.push(args),routeExtension:async(...args)=>calls.push(args),finish:async(...args)=>calls.push(args)};
    const event={type:'ChannelDtmfReceived',digit:entry.digit,channel:{id:session.callId}};
    await handleDtmf(event,new Map([[session.callId,session]]),deps);
    await handleDtmf(event,new Map([[session.callId,session]]),deps);
    assert.deepEqual(calls,[[session.callId,{type:entry.extension==='0'?'operator':'extension',extension:entry.extension}],[session]]);
    assert.equal(session.transferring,true);
  }
});

test('saved menu choices are also available as explicit spoken option numbers',()=>{
  assert.deepEqual(callerRouteIntent('Option 5 please.',{menu,allowedExtensions}),{type:'extension',extension:'105'});
  assert.deepEqual(callerRouteIntent('5',{menu,allowedExtensions}),{type:'extension',extension:'105'});
  assert.equal(callerRouteIntent('9',{menu,allowedExtensions}),null);
});

test('unmapped digits and non-owned channels cannot transfer calls',async()=>{
  const session={callId:'owned-caller',frames:[]};
  const deps={menu,allowedExtensions,route:async()=>assert.fail('no route'),routeExtension:async()=>assert.fail('no route')};
  for(const event of [{digit:'9',id:session.callId},{digit:'5',id:'other-caller'}]){
    await handleDtmf({type:'ChannelDtmfReceived',digit:event.digit,channel:{id:event.id}},new Map([[session.callId,session]]),deps);
  }
  assert.equal(session.transferring,undefined);
});

test('menu validation rejects stale, duplicated, injected and external destinations',()=>{
  for(const invalid of [
    [{...entries[1],extension:'999'}], [{...entries[1],extension:'SIP/attacker'}],
    [{...entries[1],digit:'10'}], [entries[1],entries[1]],
    [{...entries[1],digit:'0'}], [{...entries[1],label:'bad\nlabel'}],
  ])assert.throws(()=>menuOptions(JSON.stringify(invalid),allowedExtensions),/PARIS_MENU_INVALID/);
  assert.equal(menuRoute('8',menuOptions(menu,allowedExtensions)),null);
  assert.throws(()=>openingText('x'.repeat(1200),entries),/GREETING_TOO_LONG/);
});

test('failed menu transfer returns the caller to the existing voicemail fallback',async()=>{
  const session={callId:'owned-caller',frames:[]};const calls=[];
  await handleDtmf({type:'ChannelDtmfReceived',digit:'5',channel:{id:session.callId}},new Map([[session.callId,session]]),{
    menu,allowedExtensions,routeExtension:async()=>{throw Error('ARI error');},finish:async(...args)=>calls.push(args),
  });
  assert.deepEqual(calls,[[session,'continue']]);
});
