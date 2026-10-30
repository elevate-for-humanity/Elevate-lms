import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {checkpointMetadata} from './diagnose-studio-checkpoint.mjs';
function fixture(){
 const owner='qa-owner',secret='fixture-secret';
 const key=crypto.createHash('sha256').update(secret+'\0studio-browser-workspace-v1').digest(),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(owner));
 const state={version:1,owner,viewport:{width:1280,height:720},tabs:['https://account.envato.com/sign_in'],storageState:{cookies:[{value:'private-cookie'}],origins:[{origin:'https://account.envato.com',localStorage:[{value:'private-storage'}]},{origin:'https://external.example',localStorage:[]}]}};
 const data=Buffer.concat([cipher.update(JSON.stringify(state)),cipher.final()]);
 return {owner,secret,envelope:{iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')}};
}
test('checkpoint diagnostics identify disallowed origins without exposing persisted data',()=>{
 const {owner,secret,envelope}=fixture(),report=checkpointMetadata(envelope,owner,secret,['envato.com']);
 assert.equal(report.authenticatedEncryption,true);assert.equal(report.ownerMatches,true);assert.equal(report.blockedTabs,0);assert.equal(report.blockedStorageOrigins,1);assert.equal(report.viewportValid,true);
 for(const value of [owner,secret,'private-cookie','private-storage','envato.com','external.example'])assert.ok(!JSON.stringify(report).includes(value));
});
test('wrong owner and wrong key cannot inspect a checkpoint',()=>{
 const {owner,secret,envelope}=fixture();
 assert.throws(()=>checkpointMetadata(envelope,'different-owner',secret,['envato.com']));
 assert.throws(()=>checkpointMetadata(envelope,owner,'different-key',['envato.com']));
});
