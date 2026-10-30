import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {orientationKeyForGuide,orientationCaptionGroups} from '../../lib/orientation/media-contract.mjs';
const guides=JSON.parse(readFileSync(new URL('../../lib/orientation/dashboard-orientations.json',import.meta.url),'utf8'));
test('every dashboard audience has illustrated, actionable instruction and a detailed transcript',()=>{
 assert.deepEqual(Object.keys(guides).sort(),['apprentice','barber-apprentice','cosmetology-apprentice','host-shop','hvac','learner','program-holder','site-coordinator']);
 for(const [audience,guide] of Object.entries(guides)) {
  assert.ok(guide.slides.length>=6,audience);
  for(const slide of guide.slides) {
   assert.ok(existsSync(new URL('../../public'+slide.image,import.meta.url)),slide.image);
   assert.equal(slide.points.length,3);
   assert.ok(slide.narration.split(/\s+/).length>=55,slide.title);
   assert.ok(slide.href.startsWith('/')||slide.href.startsWith('mailto:'));
   if(slide.href.startsWith('/')) {
    const route=slide.href.split('?')[0];
    assert.ok(existsSync('apps/lms/app'+route+'/page.tsx')||existsSync('apps/lms/app/lms/(app)'+route.slice(4)+'/page.tsx'),route);
   }
  }
 }
});
test('HVAC includes the owner-approved schedule and verified David contact',()=>{
 const text=JSON.stringify(guides.hvac);
 for(const value of ['Weeks 1–4','Weeks 5–6','David Nazaire','(215) 214-9355','indyondemandservices@gmail.com'])assert.ok(text.includes(value),value);
 assert.ok(text.includes('Wait for confirmation'));
});
test('media keys reject arbitrary audiences, paths and formats, and change when instructions change',()=>{
 assert.equal(orientationKeyForGuide('../private','mp4',guides.learner),null);
 assert.equal(orientationKeyForGuide('learner','html',guides.learner),null);
 assert.equal(orientationKeyForGuide('learner','mp4',null),null);
 const first=orientationKeyForGuide('learner','mp4',guides.learner);
 assert.match(first,/^dashboard-orientations\/learner\/[a-f0-9]{16}\.mp4$/);
 assert.notEqual(first,orientationKeyForGuide('learner','mp4',{...guides.learner,title:'Revised'}));
});

test('long technical captions stay bounded without losing or retiming words',()=>{
 const words='Your Site Coordinator dashboard connects regional intake Program Holders host sites active learners and reporting'.split(' ').map((word,i)=>({word,start:i,end:i+.8}));
 const groups=orientationCaptionGroups(words);
 assert.deepEqual(groups.flat(),words);
 for(const group of groups){assert.ok(group.length<=8);assert.ok(group.map(w=>w.word).join(' ').length<=68);}
 assert.throws(()=>orientationCaptionGroups([{word:'bad',start:1,end:0}]),/CAPTION_INVALID/);
});
