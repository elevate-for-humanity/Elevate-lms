import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=()=>readFileSync(new URL('../../.github/workflows/deploy-admin.yml',import.meta.url),'utf8');
test('Admin Docker build precedes Google identity and billing admission',()=>{
 const s=workflow(),build=s.indexOf('      - name: Build the Admin image');
 assert.ok(build>=0);
 assert.ok(build<s.indexOf('uses: google-github-actions/auth@'), 'Google identity must not gate the independent Docker build');
 assert.ok(build<s.indexOf('      - name: Verify project billing'), 'Google billing must not gate the independent Docker build');
});
test('Google upload retains authenticated SDK and billing checks',()=>{
 const s=workflow(),auth=s.indexOf('uses: google-github-actions/auth@'),sdk=s.indexOf('      - name: Verify Google SDK'),billing=s.indexOf('      - name: Verify project billing'),upload=s.indexOf('      - name: Upload and deploy the exact Admin image');
 assert.ok(auth>=0 && auth<sdk && sdk<billing && billing<upload);
});

for (const [file,buildLabel,uploadLabel] of [
 ['build-google-migration-images.yml','Build existing Dockerfile without server secrets','Upload versioned image'],
 ['deploy-google-store-runtime.yml','Build shared commerce application for Store','Upload tested Store image'],
]) test(file+' builds before Google authentication and keeps billing before upload',()=>{
 const s=readFileSync(new URL('../../.github/workflows/'+file,import.meta.url),'utf8');
 const build=s.indexOf('      - name: '+buildLabel),auth=s.indexOf('uses: google-github-actions/auth@');
 const billing=s.indexOf('run: node scripts/gcp/preflight-billing.mjs'),upload=s.indexOf('      - name: '+uploadLabel);
 assert.ok(build>=0 && build<auth,'Google identity must not gate image building');
 assert.ok(auth<billing && billing<upload,'Google upload must retain billing admission');
});

test('ordinary Admin releases retain the current browser workspace binding until a verified cutover',()=>{
 const s=workflow();
 assert.ok(!s.includes('STUDIO_BROWSER_ENV='));
 const update=s.slice(s.indexOf('gcloud run services update elevate-admin-migration'),s.indexOf('      - name: Health-check and activate'));
 assert.ok(update.includes('--update-env-vars="AI_NARRATION_PROVIDER=kokoro"'));
 assert.ok(!update.includes('STUDIO_BROWSER_URL='));
 assert.ok(!update.includes('STUDIO_BROWSER_PUBLIC_URL='));
});
