import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSection, ensureComposableSiteConfig } from '../lib/tenant/site-composition.ts';
import { tenantSiteHref } from '../lib/tenant/site-links.ts';

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
