import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {classifySearchFailure} from '../../lib/devstudio/github-search-fallback.ts';

const source=readFileSync(new URL('../../lib/devstudio/paris-code-engineer.ts',import.meta.url),'utf8');

// Execute the actual search function with a scripted, offline GitHub transport.
// The former assertion required a bare [] and broke when the result acquired
// a typed fallback receipt. Verify the behavior, including fail-closed auth,
// instead of requiring a particular spelling of its implementation.
function engineer(statuses){
  const start=source.indexOf('async function searchCode(');
  const end=source.indexOf('\nfunction suggestedSourcePaths(',start);
  assert.ok(start>=0&&end>start,'locate the runtime search function');
  const requests=[];
  const remaining=[...statuses];
  const factory=new Function('fetch','githubHeaders','REPOSITORY','GH_API',
    'classifySearchFailure','blockedPath','normalizePath',
    stripTypeScriptTypes(source.slice(start,end))+'\nreturn searchCode;');
  const searchCode=factory(async(url,init)=>{
    requests.push({url,init});
    assert.ok(remaining.length,'unexpected GitHub request');
    return Response.json({items:[]},{status:remaining.shift()});
  },async()=>({Authorization:'Bearer isolated-fixture'}),
    'elevate-for-humanity/Elevate-lms','https://api.github.com',
    classifySearchFailure,()=>{throw Error('unexpected path filtering');},path=>path);
  return {searchCode,requests,remaining};
}

test('PARIS treats denied or rate-limited optional GitHub code search as discovery failure, not repair failure',async()=>{
  for(const [status,fallback] of [[403,'SEARCH_FORBIDDEN_FALLBACK'],[429,'SEARCH_RATE_LIMITED_FALLBACK']]){
    const e=engineer([status]);
    assert.deepEqual(await e.searchCode('route failure'),{matches:[],searchFallback:fallback});
    assert.equal(e.requests.length,1);
    assert.match(e.requests[0].url,/\/search\/code\?/);
    assert.equal(e.remaining.length,0);
  }
  const noMatches=engineer([200]);
  assert.deepEqual(await noMatches.searchCode('route failure'),{matches:[],searchFallback:'none'});
  assert.equal(noMatches.requests.length,1);
});

test('PARIS verifies repository authority before accepting a search 401 as optional discovery',async()=>{
  const e=engineer([401,200]);
  assert.deepEqual(await e.searchCode('route failure'),{matches:[],searchFallback:'SEARCH_FORBIDDEN_FALLBACK'});
  assert.equal(e.requests.length,2);
  assert.equal(e.requests[1].url,'https://api.github.com/repos/elevate-for-humanity/Elevate-lms/git/ref/heads/main');
  assert.equal(e.requests[1].init.redirect,'error');
  assert.equal(e.requests[0].init.headers.Authorization,e.requests[1].init.headers.Authorization);
  for(const status of [401,403]){
    const denied=engineer([401,status]);
    await assert.rejects(denied.searchCode('route failure'),new RegExp('repository authorization failed: '+status));
    assert.equal(denied.requests.length,2);
  }
  const unavailable=engineer([500]);
  await assert.rejects(unavailable.searchCode('route failure'),/GitHub code search failed: 500/);
  assert.equal(unavailable.requests.length,1);
});

test('PARIS retains authenticated tree, directory and exact-file discovery after an optional search failure',()=>{
  assert.match(source,/const \{ matches, searchFallback \} = await searchCode\(action\.query\)/);
  assert.match(source,/if \(searchFallback !== 'none'\)/);
  assert.match(source,/if \(!matches\.length\) \{\s*const tree = await githubJson\(/);
  assert.match(source,/if \(action\.type === 'list'\)/);
  assert.match(source,/if \(action\.type === 'read' \|\| action\.type === 'list'\)/);
  assert.match(source,/await readFile\(action\.path, branch, task \+ JSON\.stringify\(sourceEvidence \?\? \{\}\)\)/);
  assert.match(source,/Repository path is not allowed/);
});
