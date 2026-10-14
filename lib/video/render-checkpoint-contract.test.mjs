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
 assert.match(STORYBOARD_RENDER_PRODUCER,/tracking-v4$/);
});
test('worker images copy and compile current rendering source rather than only inheriting it',()=>{
 const docker=readFileSync('Dockerfile.ultimate-worker','utf8');
 assert.match(docker,/COPY remotion-src \.\/remotion-src/);
 assert.match(docker,/bundle\(\{entryPoint:'\/app\/remotion-src\/index.ts'/);
 assert.ok(docker.indexOf('COPY remotion-src')<docker.indexOf("bundle({entryPoint:'/app/remotion-src/index.ts'"));
});
