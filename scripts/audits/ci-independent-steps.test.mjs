import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../../.github/workflows/ci.yml',import.meta.url),'utf8');
const preflight=source.split('\n  preflight:')[1]?.split('\n  typecheck:')[0]??'';
test('CI does not skip independent preflight tests after an earlier failure',()=>{
 assert.match(preflight,/name: Install dependencies\n        id: dependencies/);
 const chunks=preflight.split(/(?=^      - name: )/m).filter(x=>x.startsWith('      - name: '));
 let checked=0;
 for(const section of chunks){
  if(section.startsWith('      - name: Install dependencies'))continue;
  if(section.startsWith('      - name: Verify requested CI commit')){
   // Release identity is checked before checkout and dependency installation.
   // It is intentionally dispatch-only; this is not an independently runnable
   // post-install regression, so keep its stronger early guard intact.
   assert.match(section,/if: github\.event_name == 'workflow_dispatch' && inputs\.requested_sha != ''/);
   assert.match(section,/GITHUB_REF.*refs\/heads\/main/);
   assert.match(section,/REQUESTED_SHA.*GITHUB_SHA/);
   assert.ok(preflight.indexOf(section)<preflight.indexOf('      - uses: actions/checkout@v4'),
    'Requested-commit verification must execute before repository checkout');
   continue;
  }
  if(!section.includes('\n        run:')&&!section.includes('\n        uses:'))continue;
  assert.match(section,/if: \$\{\{ !cancelled\(\) && steps\.dependencies\.outcome == 'success'/,
    'Missing independent execution condition: '+section.split('\n')[0]);
  assert.ok(preflight.indexOf(section)>preflight.indexOf('      - name: Install dependencies'),
    'Dependency outcome checked before installation: '+section.split('\n')[0]);
  checked++;
 }
 assert.ok(checked>=40,'Expected comprehensive preflight coverage');
});
test('CI retains event and origin constraints for live database checks',()=>{
 for(const name of ['Portal/database schema drift — live production contract','Supabase write payloads — live production contract','Live portal data integrity']){
  const section=preflight.split('name: '+name)[1]?.split('\n      - name:')[0];
  assert.match(section??'',/github\.event_name != 'pull_request'/);
 }
 for(const name of ['Course dispatch PostgREST projection (read-only)','Learner inbox PostgREST projection (read-only)']){
  const section=preflight.split('name: '+name)[1]?.split('\n      - name:')[0];
  assert.match(section??'',/github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
 }
});
