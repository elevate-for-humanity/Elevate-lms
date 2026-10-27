import test from 'node:test';
import assert from 'node:assert/strict';
import {productionBrowserEnvironment} from './production-browser-binding.mjs';
const origin='https://elevate-studio-browser-aabnh2y32a-uc.a.run.app';
const resource=url=>({metadata:{name:'elevate-studio-browser'},status:{url,traffic:[{tag:'studio-verify',url:'https://studio-verify---elevate-studio-browser-aabnh2y32a-uc.a.run.app'}]}});
test('production uses the stable service origin even when a preview alias exists',()=>assert.deepEqual(productionBrowserEnvironment(resource(origin)),{STUDIO_BROWSER_URL:origin,STUDIO_BROWSER_PUBLIC_URL:origin}));
test('number-based canonical Cloud Run origins remain supported',()=>{const url='https://elevate-studio-browser-484736877039.us-central1.run.app';assert.equal(productionBrowserEnvironment(resource(url)).STUDIO_BROWSER_URL,url);});
test('preview aliases never become the production browser binding',()=>assert.throws(()=>productionBrowserEnvironment(resource('https://studio-verify---elevate-studio-browser-aabnh2y32a-uc.a.run.app')),/Canonical/));
test('missing, unrelated and credential-bearing destinations are refused',()=>{for(const url of [undefined,'http://elevate-studio-browser-aabnh2y32a-uc.a.run.app','https://other-service.run.app','https://elevate-studio-browser-foo.run.app.evil.test','https://operator:password@elevate-studio-browser-foo.run.app','https://elevate-studio-browser-foo.run.app/path','https://elevate-studio-browser-foo.run.app?preview=1'])assert.throws(()=>productionBrowserEnvironment(resource(url)));assert.throws(()=>productionBrowserEnvironment({metadata:{name:'other'},status:{url:origin}}));});
