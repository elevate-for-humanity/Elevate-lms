import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {launchBrowser} from './cdp-browser.mjs';
import {BrowserWorkspaceStore} from './browser-workspace-store.mjs';
import {attachBrowserTabs,restoreBrowserWorkspaceTabs} from './server.mjs';
test('real Chromium replacement restores owner browser cookies, local storage and active tab',{
 skip:!process.env.STUDIO_BROWSER_EXECUTABLE_PATH,timeout:60000,
},async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'browser-workspace-restart-'));let browser;
 const fixture=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><h1>Workspace recovery fixture</h1>');});
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+fixture.address().port;
 t.after(async()=>{await browser?.close();fixture.closeAllConnections();await new Promise(r=>fixture.close(r));await fs.rm(directory,{recursive:true,force:true});});
 const config={secret:'fixture-key',directory};
 browser=await launchBrowser({executablePath:process.env.STUDIO_BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:780}}),page=await context.newPage();await page.goto(origin+'/first');
 await page.evaluate(()=>{localStorage.setItem('draft','restored lesson draft');document.cookie='workspace=authorized;path=/';});
 const session={ownerId:'owner-a',context,page,viewport:{width:390,height:780},events:[]};attachBrowserTabs(session,()=>{});
 const second=await context.newPage();await second.goto(origin+'/second');const first=[...session.pages.entries()][0];session.activeTabId=first[0];session.page=first[1];
 await new BrowserWorkspaceStore(config).save(session);await browser.close();browser=null;
 const checkpoint=await new BrowserWorkspaceStore(config).load('owner-a');assert.equal(await new BrowserWorkspaceStore(config).load('owner-b'),null);
 browser=await launchBrowser({executablePath:process.env.STUDIO_BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
 const recoveredContext=await browser.newContext({viewport:checkpoint.viewport,storageState:checkpoint.storageState});const recoveredPage=await recoveredContext.newPage();await recoveredPage.goto(checkpoint.tabs[0]);
 const recovered={context:recoveredContext,page:recoveredPage,viewport:checkpoint.viewport,events:[]};attachBrowserTabs(recovered,()=>{});await restoreBrowserWorkspaceTabs(recovered,checkpoint);
 assert.equal(recovered.pages.size,2);assert.equal(recovered.page.url(),origin+'/first');assert.equal(await recovered.page.evaluate(()=>localStorage.getItem('draft')),'restored lesson draft');assert.ok((await recovered.page.evaluate(()=>document.cookie)).includes('workspace=authorized'));assert.equal(recovered.page.viewportSize().width,390);
});

test('storage origin restoration preserves state without issuing a network request',{
 skip:!process.env.STUDIO_BROWSER_EXECUTABLE_PATH,timeout:30000,
},async t=>{
 let requests=0,browser;
 const fixture=http.createServer((req,res)=>{requests++;res.end('<!doctype html><title>Origin fixture</title>');});
 await new Promise(r=>fixture.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+fixture.address().port;
 t.after(async()=>{await browser?.close();fixture.closeAllConnections();await new Promise(r=>fixture.close(r));});
 browser=await launchBrowser({executablePath:process.env.STUDIO_BROWSER_EXECUTABLE_PATH,args:['--no-sandbox']});
 const context=await browser.newContext({storageState:{cookies:[],origins:[{origin,localStorage:[{name:'saved-preference',value:'preserved'}]}]}});
 assert.equal(requests,0,'restoring embedded origin state must not contact its server');
 assert.equal(context.pages().length,0,'synthetic restoration documents stay out of operator tabs');
 const page=await context.newPage();await page.goto(origin);
 assert.ok(requests>0,'normal explicit navigation still contacts the fixture');
 assert.equal(await page.evaluate(()=>localStorage.getItem('saved-preference')),'preserved');
});
