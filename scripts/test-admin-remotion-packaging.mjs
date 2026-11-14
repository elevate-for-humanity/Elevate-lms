import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,cpSync,mkdirSync,mkdtempSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {bundle} from '@remotion/bundler';

test('Admin runtime bundles the composition using only Docker-packaged teaching sources', {timeout:60000}, async()=>{
 const docker=readFileSync(new URL('../Dockerfile.admin',import.meta.url),'utf8');
 const root=resolve(new URL('..',import.meta.url).pathname);
 const staging=mkdtempSync(join(tmpdir(),'paris-remotion-packaging-'));
 try {
  // Stage the actual Docker COPY statements, not a hand-maintained test fixture.
  const copies=[...docker.matchAll(/^COPY --from=builder --chown=nextjs:nodejs (\/workspace\/(?:remotion-src|lib\/ultimate-course-builder\/instructional)[^\s]*) (\/app\/apps\/admin\/[^\s]+)$/gm)];
  assert.ok(copies.length>=2,'canonical composition and authored helpers must be packaged');
  for(const [,source,target] of copies) {
   const destination=join(staging,target.slice('/app/'.length));
   mkdirSync(dirname(destination),{recursive:true});
   cpSync(join(root,source.slice('/workspace/'.length)),destination,{recursive:true});
  }
  symlinkSync(join(root,'node_modules'),join(staging,'node_modules'),'dir');
  await bundle({entryPoint:join(staging,'apps/admin/remotion-src/index.ts'),outDir:join(staging,'bundle')});
 } finally {rmSync(staging,{recursive:true,force:true});}
});
