import test from 'node:test';
import assert from 'node:assert/strict';
import {loopbackOnUnavailableInterfaces} from './remotion-host-compat.mjs';
test('healthy Remotion host selection and arguments are preserved',()=>{
 const config={host:'::',hostsToTry:['::1']};let arg;
 const select=loopbackOnUnavailableInterfaces(value=>{arg=value;return config;});
 assert.equal(select(true),config);assert.equal(arg,true);
});
test('unsupported enumeration falls back to verified IPv4 loopback only',()=>{
 let calls=0;const select=loopbackOnUnavailableInterfaces(()=>{calls++;throw {code:'ERR_SYSTEM_ERROR',info:{syscall:'uv_interface_addresses'}};});
 assert.deepEqual(select(false),{host:'127.0.0.1',hostsToTry:['127.0.0.1']});select(false);assert.equal(calls,1);
});
test('unrelated permission and system errors remain failures',()=>{
 for(const error of [{code:'EACCES'},{code:'ERR_SYSTEM_ERROR',info:{syscall:'other'}}]){
  assert.throws(()=>loopbackOnUnavailableInterfaces(()=>{throw error;})(),e=>e===error);
 }
});
