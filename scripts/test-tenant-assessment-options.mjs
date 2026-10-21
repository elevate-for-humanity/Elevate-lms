import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSection, ensureComposableSiteConfig } from '../lib/tenant/site-composition.ts';
import { tenantSiteHref } from '../lib/tenant/site-links.ts';
import fs from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

const bridgeSource = await fs.readFile(new URL('../lib/tenant/legacy-composition-bridge.ts', import.meta.url), 'utf8');
const bridgeModule = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(bridgeSource.replace("'@/lib/tenant/site-composition'", JSON.stringify(new URL('../lib/tenant/site-composition.ts', import.meta.url).href)))).toString('base64'));

function canonicalFixture() {
  return {homepage:{heroTitle:'Old summary',features:[{title:'Old features'}]},programs:[],pages:[
    {id:'home',slug:'/',title:'Home',sections:[{id:'hero',type:'hero',content:{title:'Approved premium headline'}},{id:'framework',type:'features',content:{items:[{title:'Goals'},{title:'Revenue'},{title:'Operations'},{title:'Workforce'},{title:'Succession'}]}}]},
    {id:'services',slug:'/services',title:'Services',sections:[{id:'services',type:'services',content:{items:[{title:'Strategic Planning'}]}}]},
  ]};
}
test('saving a full page model cannot overwrite premium copy from stale legacy summaries',()=>{
  const config=canonicalFixture();
  const saved=bridgeModule.bridgeLegacyPatchIntoComposition(config,structuredClone(config));
  assert.equal(saved.pages[0].sections[0].content.title,'Approved premium headline');
  assert.equal(saved.pages[0].sections[1].content.items.length,5);
  assert.equal(saved.pages[1].sections[0].content.items[0].title,'Strategic Planning');
});
test('legacy-only edits still update the existing page model',()=>{
  const saved=bridgeModule.bridgeLegacyPatchIntoComposition(canonicalFixture(),{homepage:{heroTitle:'Explicit legacy edit'}});
  assert.equal(saved.pages[0].sections[0].content.title,'Explicit legacy edit');
  assert.equal(saved.pages[0].sections[1].content.items.length,5);
});

test('assessment, journal and event actions stay in the tenant preview', () => {
  const base = '/sites/legacy83-preview';
  assert.equal(tenantSiteHref('/contact',base),base+'/contact');
  assert.equal(tenantSiteHref('/',base),base);
  assert.equal(tenantSiteHref(base+'/contact',base),base+'/contact');
  assert.equal(tenantSiteHref('/contact'),'/contact');
  assert.equal(tenantSiteHref('https://booking.example.com',base),'https://booking.example.com');
  assert.equal(tenantSiteHref('mailto:info@example.com',base),'mailto:info@example.com');
});

test('assessment options and numeric scores survive repeated normalization', () => {
  const section = { id: 'iq', type: 'assessment', content: { questions: [{ question: 'Goals?', options: [{label:'Not yet',score:1},{label:'Clear',score:3}] }] } };
  const once = sanitizeSection(section);
  const twice = sanitizeSection(once);
  assert.deepEqual(twice.content.questions[0].options, section.content.questions[0].options);
});

test('custom form select strings remain intact and nested options stay bounded', () => {
  const result = sanitizeSection({type:'contact_form',content:{fields:[{name:'topic',options:['Strategy','Leadership']}]}});
  assert.deepEqual(result.content.fields[0].options,['Strategy','Leadership']);
  const bounded = sanitizeSection({type:'assessment',content:{questions:[{options:Array.from({length:30},()=>({label:'x'.repeat(4000),score:3,deep:{secret:true}}))}]}});
  assert.equal(bounded.content.questions[0].options.length,20);
  assert.equal(bounded.content.questions[0].options[0].label.length,3000);
  assert.equal(bounded.content.questions[0].options[0].deep,undefined);
});

test('all nine saved page routes remain discoverable', () => {
  const slugs = ['/', '/about','/services','/academy','/resources','/growth-iq','/journal','/events','/contact'];
  const config = ensureComposableSiteConfig({pages:slugs.map((slug,i)=>({id:String(i),slug,title:slug,sections:[]}))});
  assert.deepEqual(config.navigation.map(item=>item.href),slugs);
});
