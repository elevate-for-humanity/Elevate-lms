import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyboardRenderFingerprint,STORYBOARD_RENDER_PRODUCER} from './render-checkpoint-contract.mjs';
const input={scenes:[{title:'Preserved lesson',audio:'approved.mp3'}],fps:30,totalFrames:13500,layoutVersion:4};
test('new rendering contracts cannot reuse old encoded segments with identical lesson data',()=>{
 assert.notEqual(storyboardRenderFingerprint(input,'old-static-layout'),storyboardRenderFingerprint(input));
 assert.equal(storyboardRenderFingerprint(input),storyboardRenderFingerprint({...input}));
 assert.equal(storyboardRenderFingerprint(input),storyboardRenderFingerprint({...input,producer:'cannot-override-current-contract'}));
 assert.notEqual(storyboardRenderFingerprint(input),storyboardRenderFingerprint({...input,totalFrames:14000}));
});
test('lesson evidence, segment storage and render result use the same producer version',()=>{
 for(const file of ['lib/ultimate-course-builder/core/lesson-contract.ts','lib/ultimate-course-builder/adapters/platform-renderer.ts'])
  assert.match(readFileSync(file,'utf8'),/STORYBOARD_RENDER_PRODUCER/);
 assert.match(readFileSync('lib/video/remotion-render.ts','utf8'),/const fingerprint = storyboardRenderFingerprint/);
 assert.notEqual(storyboardRenderFingerprint(input,STORYBOARD_RENDER_PRODUCER+'-previous'),storyboardRenderFingerprint(input));
});
test('worker images copy and compile current rendering source rather than only inheriting it',()=>{
 const docker=readFileSync('Dockerfile.ultimate-worker','utf8');
 assert.match(docker,/COPY remotion-src \.\/remotion-src/);
 assert.match(docker,/bundle\(\{entryPoint:'\/app\/remotion-src\/index.ts'/);
 assert.ok(docker.indexOf('COPY remotion-src')<docker.indexOf("bundle({entryPoint:'/app/remotion-src/index.ts'"));
});

test('a forced repair cannot reuse rejected frames, while restart of that repair reuses its own segments',()=>{
 const first={...input,renderRevision:'owner-request-1'};
 assert.equal(storyboardRenderFingerprint(first),storyboardRenderFingerprint({...first}));
 assert.notEqual(storyboardRenderFingerprint(first),storyboardRenderFingerprint({...input,renderRevision:'owner-request-2'}));
 assert.notEqual(storyboardRenderFingerprint(first),storyboardRenderFingerprint(input));
});

test('renewed Supabase and S3 credentials reuse the same media checkpoint identity',()=>{
 const make=(token,signature)=>({...input,scenes:[{imageUrl:'https://project.supabase.co/storage/v1/object/sign/photos/example.png?token='+token,pictureCues:[{imageUrl:'https://media.example/photo.png?X-Amz-Date='+token+'&X-Amz-Signature='+signature+'&versionId=v1'}],audioSrc:'https://media.example/audio.mp3?X-Amz-Credential='+token+'&X-Amz-Security-Token='+signature}]});
 const first=make('old','old-signature');const saved=structuredClone(first);
 assert.equal(storyboardRenderFingerprint(first),storyboardRenderFingerprint(make('renewed','new-signature')));
 assert.deepEqual(first,saved);
});
test('media paths, versions, teaching, timing and explicit repairs still invalidate checkpoints',()=>{
 const first={...input,scenes:[{imageUrl:'https://media.example/photo.png?X-Amz-Signature=old&versionId=v1',durationFrames:900,narration:'Teach sanitation'}]};
 for(const scenes of [[{...first.scenes[0],imageUrl:first.scenes[0].imageUrl.replace('photo.png','other.png')}],[{...first.scenes[0],imageUrl:first.scenes[0].imageUrl.replace('v1','v2')}],[{...first.scenes[0],durationFrames:901}],[{...first.scenes[0],narration:'Different teaching'}]])
  assert.notEqual(storyboardRenderFingerprint(first),storyboardRenderFingerprint({...first,scenes}));
 assert.notEqual(storyboardRenderFingerprint(first),storyboardRenderFingerprint({...first,renderRevision:'new-approved-repair'}));
 assert.notEqual(storyboardRenderFingerprint({...input,scenes:[{imageUrl:'https://example.test/photo?token=asset-one'}]}),storyboardRenderFingerprint({...input,scenes:[{imageUrl:'https://example.test/photo?token=asset-two'}]}));
});
