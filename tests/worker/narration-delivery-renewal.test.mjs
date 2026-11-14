import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const source=readFileSync(new URL('../../lib/ultimate-course-builder/quality/narration-audio-analysis.ts',import.meta.url),'utf8');
const functions=source.slice(source.indexOf('function trustedHttpsUrl'),source.indexOf('export async function analyzeNarrationAudio'));
async function load(signed='https://media.example.invalid/bucket/course-videos/generated-lessons/speech.mp3?fresh=1'){
 const code=`const getElevateMediaStorageConfig=()=>({endpoint:'https://media.example.invalid',bucket:'bucket'});
 const getSignedElevateMediaUrl=async(key)=>{calls.push(key);return ${JSON.stringify(signed)}};
 export const calls=[];\n`+stripTypeScriptTypes(functions);
 return import('data:text/javascript;base64,'+Buffer.from(code+'\n//'+Math.random()).toString('base64'));
}
test('resumed rendering renews the same private stored speech object',async()=>{
 const m=await load();
 const renewed=await m.resolveStoredNarrationUrl('https://media.example.invalid/bucket/course-videos/generated-lessons/speech.mp3?expired=1');
 assert.equal(renewed.search,'?fresh=1');
 assert.deepEqual(m.calls,['course-videos/generated-lessons/speech.mp3']);
});
test('renewal rejects unrelated hosts, traversal and a signer returning another object',async()=>{
 const m=await load();
 for(const url of ['https://unrelated.example/speech.mp3','https://media.example.invalid/bucket/course-videos/%2e%2e%2fsecret.mp3'])
  await assert.rejects(m.resolveStoredNarrationUrl(url),/UNTRUSTED_AUDIO_URL/);
 const changed=await load('https://media.example.invalid/bucket/course-videos/other.mp3?fresh=1');
 await assert.rejects(changed.resolveStoredNarrationUrl('https://media.example.invalid/bucket/course-videos/generated-lessons/speech.mp3?expired=1'),/REFERENCE_MISMATCH/);
});
test('renderer fetches and delivers the renewed URL while keeping approved timing checks',()=>{
 const renderer=readFileSync(new URL('../../lib/video/remotion-render.ts',import.meta.url),'utf8');
 assert.match(renderer,/resolveStoredNarrationUrl\(approvedAudio.audioUrl\)/);
 assert.match(renderer,/fetch\(approvedAudioUrl,/);
 assert.match(renderer,/audioSrc = approvedAudioUrl;/);
 assert.match(renderer,/ULTIMATE_APPROVED_AUDIO_DURATION_CHANGED/);
});

test('finished-media QA renews the saved private MP4 before inspection',()=>{
 const handlers=readFileSync(new URL('../../lib/ultimate-course-builder/core/production-handlers.ts',import.meta.url),'utf8');
 assert.match(handlers,/const currentMediaUrl = await resolveStoredNarrationUrl\(storedMediaUrl\)/);
 assert.match(handlers,/videoUrl: currentMediaUrl\.toString\(\)/);
});
