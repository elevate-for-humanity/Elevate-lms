import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRestoredBrowserWorkspace} from './server.mjs';
const lookup=async()=>[{address:'93.184.216.34',family:4}];
const checkpoint=()=>({tabs:['https://account.envato.com/sign_in'],storageState:{origins:[
 {origin:'https://account.envato.com',localStorage:[]},
 {origin:'https://embedded.example',localStorage:[{name:'preference',value:'retained'}]},
]}});
test('restores public embedded origins without widening top-level navigation',async()=>{
 const state=checkpoint();await validateRestoredBrowserWorkspace(state,{lookup});
 assert.equal(state.storageState.origins[1].localStorage[0].value,'retained');
 state.tabs=['https://embedded.example/'];
 await assert.rejects(validateRestoredBrowserWorkspace(state,{lookup}),/invalid_target/);
});
test('storage restoration still rejects private networks and malformed origins',async()=>{
 for(const origin of ['file:///private','https://user:secret@embedded.example','https://embedded.example/path','https://embedded.example:8443']){
  const state=checkpoint();state.storageState.origins=[{origin}];
  await assert.rejects(validateRestoredBrowserWorkspace(state,{lookup}),/invalid_target/);
 }
 for(const address of ['127.0.0.1','169.254.169.254','10.0.0.1','::1']){
  const state=checkpoint();state.tabs=['about:blank'];
  await assert.rejects(validateRestoredBrowserWorkspace(state,{lookup:async()=>[{address}]}),/invalid_target/);
 }
});
