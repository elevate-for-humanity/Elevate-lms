import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(await readFile(new URL('../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8'));
const start=source.indexOf('async function rejectedReadFeedback(');
assert.ok(start>=0);
const helper=source.slice(start,source.indexOf('async function writeFile(',start));
function fixture({protectedPath=false,results=[]}={}) {
 const calls=[];
 const feedback=new Function('blockedPath','listDirectory','rejectedSourceRead',helper+';return rejectedReadFeedback;')(
  ()=>protectedPath,
  async(path,branch)=>{calls.push({path,branch});const result=results.shift();if(result instanceof Error)throw result;return result??[];},
  error=>/not a directory|Repository path is not allowed|GitHub API 404 for \/contents/.test(error.message),
 );
 return {feedback,calls};
}
test('missing source read supplies actual parent entries on the same task branch',async()=>{
 const f=fixture({results:[[{path:'lib/ai/ai-service.ts',type:'file'}]]});
 const result=await f.feedback('lib/ai/chat','studio/task');
 assert.deepEqual(f.calls,[{path:'lib/ai',branch:'studio/task'}]);
 assert.match(result,/LIST lib\/ai:/);assert.match(result,/ai-service\.ts/);
});
test('protected paths do not disclose parent directory contents',async()=>{
 const f=fixture({protectedPath:true});
 assert.match(await f.feedback('lib/secrets.ts','studio/task'),/READ_REJECTED/);
 assert.deepEqual(f.calls,[]);
});
test('missing parents recover through bounded ancestor discovery',async()=>{
 const missing=()=>Error('GitHub API 404 for /contents/missing');
 const f=fixture({results:[missing(),missing(),[{path:'lib/ai',type:'dir'}]]});
 assert.match(await f.feedback('lib/missing/deep/chat.ts','studio/task'),/LIST lib:/);
 assert.equal(f.calls.length,3);
 const exhausted=fixture({results:[missing(),missing(),missing()]});
 assert.match(await exhausted.feedback('lib/a/b/c/d.ts','studio/task'),/READ_REJECTED/);
 assert.equal(exhausted.calls.length,3);
});
test('authorization and network failures are propagated without discovery retries',async()=>{
 for(const message of ['GitHub API 401 for /contents/lib: Bad credentials','GitHub API 403 for /contents/lib: Forbidden','request timed out']){
  const f=fixture({results:[Error(message)]});
  await assert.rejects(f.feedback('lib/ai/chat','studio/task'),{message});
  assert.equal(f.calls.length,1);
 }
});
test('planner records recovered directory evidence in durable observations',()=>{
 assert.ok(source.includes('observations.push(await rejectedReadFeedback(action.path, branch))'));
});
