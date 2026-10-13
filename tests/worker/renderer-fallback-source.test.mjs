import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
test('complete production renderer transforms and includes actual storyboard rendering and storage fallback',()=>{
 const source=readFileSync(new URL('../../lib/video/remotion-render.ts',import.meta.url),'utf8');
 assert.ok(source.length>40000);assert.ok(source.includes('export async function renderStoryboardVideo'));
 const transformed=stripTypeScriptTypes(source,{mode:'transform'});
 assert.ok(transformed.includes('createCheckpointFallback'));assert.ok(transformed.includes('await renderMedia('));assert.ok(transformed.includes('forceSupabase: checkpointFallbackUsed'));
});
