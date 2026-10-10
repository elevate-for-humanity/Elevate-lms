import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRtp,rtp,isSpeech} from './ari-media.mjs';

test('PCMU RTP round trip maintains packetization and sequence',()=>{
 const state={seq:65535,timestamp:100,ssrc:123};
 const voice=Buffer.alloc(160,0xff);
 const packet=rtp(voice,state);
 const parsed=parseRtp(packet);
 assert.deepEqual(parsed.payload,voice);
 assert.equal(parsed.ssrc,123);
 assert.equal(state.seq,0);
 assert.equal(state.timestamp,260);
});
test('malformed, unsupported and truncated RTP are rejected',()=>{
 assert.equal(parseRtp(Buffer.alloc(3)),null);
 const packet=rtp(Buffer.alloc(160,0xff),{seq:0,timestamp:0,ssrc:1});
 packet[1]=8;assert.equal(parseRtp(packet),null);
 packet[0]=0x90;packet[12]=0xff;packet[13]=0xff;assert.equal(parseRtp(packet),null);
});
test('quiet PCMU is not caller speech',()=>{
 assert.equal(isSpeech(Buffer.alloc(160,0xff)),false);
 assert.equal(isSpeech(Buffer.alloc(160,0x00)),true);
});
