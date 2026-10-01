import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const CHECKS = ['desktop','mobile','pwa','film_playback','captions','knowledge_checks','guided_practice','independent_practice','scenario','practical','lesson_assessment','remediation','reassessment','progress_save','resume','completion'];
export function canonicalHash(value) {
  const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value)) ?? 'null').digest('hex');
}
export function credentialMatches(actual, expected) {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a,b);
}
function assert(condition, message) { if (!condition) throw new Error(message); }
export async function runLearnerTest(input, { browser, secret, lmsUrl, evidenceRoot = path.join(os.tmpdir(), 'ultimate-learner-evidence') }) {
  const base = new URL(lmsUrl);
  assert(base.protocol === 'https:' && base.hostname === 'app.elevateforhumanity.org', 'Canonical HTTPS LMS required');
  assert(input.requiredChecks?.length === CHECKS.length && CHECKS.every(c => input.requiredChecks.includes(c)), 'Full learner contract required');
  for (const field of ['lessonBuildId','artifactHash','mediaSha256','contractVersion','courseId','lessonId','videoUrl']) assert(typeof input[field] === 'string' && input[field], `Missing ${field}`);
  const contexts = [], observations = [], errors = [], startedAt = Date.now();
  const runId = crypto.randomUUID(), directory = path.join(evidenceRoot,runId);
  await fs.mkdir(directory,{ recursive:true, mode:0o700 });
  let setup, context, page;
  const check = async (name, action, execute) => {
    try { const observed = await execute(); observations.push({ check:name,passed:true,action,observed:String(observed) }); }
    catch(error) { observations.push({ check:name,passed:false,action,observed:String(error.message).slice(0,1000) }); }
  };
  async function authContext(viewport, mobile=false) {
    const ctx = await browser.newContext({ viewport, isMobile:mobile, hasTouch:mobile, serviceWorkers:'allow', reducedMotion:'reduce' }); contexts.push(ctx);
    const res = await ctx.request.post(`${base.origin}/api/learner-testing/session`, { headers:{ authorization:`Bearer ${secret}` }, data:{ accessToken:setup.accessToken,refreshToken:setup.refreshToken } });
    assert(res.ok(),'QA learner session rejected'); return ctx;
  }
  async function state() { const r=await page.request.get(`${base.origin}/api/learner-testing/runs/${setup.runId}`); assert(r.ok(),'Test progress readback failed'); return (await r.json()).progress; }
  async function readable(target) {
    const layout=await target.evaluate(() => ({ overflow:document.documentElement.scrollWidth>innerWidth+1, heading:!!document.querySelector('h1'),
      small:[...document.querySelectorAll('main p,main legend,main label')].some(e=>getComputedStyle(e).display!=='none' && parseFloat(getComputedStyle(e).fontSize)<14) }));
    assert(!layout.overflow && layout.heading && !layout.small,'Lesson layout has overflow, missing heading, or unreadable text'); return JSON.stringify(layout);
  }
  try {
    const bootstrap = await browser.newContext(); contexts.push(bootstrap);
    const prepared=await bootstrap.request.post(`${base.origin}/api/learner-testing/runs`,{ headers:{ authorization:`Bearer ${secret}` },data:input });
    assert(prepared.ok(),`Staged lesson setup failed (${prepared.status()}): ${(await prepared.text()).slice(0,300)}`);
    setup=await prepared.json();
    context=await authContext({width:1280,height:900});
    await context.tracing.start({screenshots:true,snapshots:true,sources:false});
    page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message.slice(0,300)));
    await page.goto(`${base.origin}${setup.path}`,{waitUntil:'domcontentloaded'});
    await page.getByTestId('staged-lesson').waitFor({timeout:30000});
    const premature=await page.request.post(`${base.origin}/api/learner-testing/runs/${setup.runId}`,{data:{action:'complete'}});
    assert(premature.status()===409,'Incomplete lesson incorrectly awarded completion');
    await check('desktop','Open protected lesson at desktop size and inspect layout',async()=>{ const d=await readable(page); await page.screenshot({path:path.join(directory,'desktop.png'),fullPage:true});return d; });
    await check('mobile','Open authenticated lesson at 390px and inspect readable controls',async()=>{
      const ctx=await authContext({width:390,height:844},true), p=await ctx.newPage();
      await p.goto(`${base.origin}${setup.path}`); await p.getByTestId('staged-lesson').waitFor(); const result=await readable(p);
      await p.screenshot({path:path.join(directory,'mobile.png'),fullPage:true}); return result;
    });
    await check('pwa','Activate the canonical LMS service worker and reload the authenticated staged lesson',async()=>{
      await page.evaluate(async()=>{const r=await navigator.serviceWorker.register('/sw-lms.js',{scope:'/'}); await navigator.serviceWorker.ready; return !!r.active;});
      await page.reload(); await page.getByTestId('staged-lesson').waitFor();
      const sw=await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL ?? '');
      assert(new URL(sw).pathname==='/sw-lms.js','Canonical LMS worker did not control lesson');
      return `Controlled by ${sw}; authenticated lesson survived reload`;
    });
    await check('captions','Load real caption track, enable it, and inspect parsed cues',async()=>{
      const video=page.locator('video'); await video.waitFor(); await video.evaluate(v=>{v.load();const t=v.textTracks[0]; if(t)t.mode='showing';});
      await page.waitForFunction(()=>{const v=document.querySelector('video');return v?.textTracks[0]?.cues?.length>0;},null,{timeout:30000});
      const c=await video.evaluate(v=>({count:v.textTracks[0].cues.length,last:v.textTracks[0].cues[v.textTracks[0].cues.length-1].endTime,duration:v.duration}));
      assert(c.last>=c.duration*.9,'Captions do not cover the full lesson'); return JSON.stringify(c);
    });
    await check('film_playback','Play the entire delivered film without seeking and observe progress and completion',async()=>{
      const v=page.locator('video'); await v.evaluate(async video=>{video.muted=true;video.playbackRate=1;await video.play();});
      await page.waitForFunction(()=>document.querySelector('video')?.currentTime>5,null,{timeout:30000});
      await check('progress_save','Read server-saved learner position after playback',async()=>{
        await page.waitForTimeout(4000); const p=await state(); assert(p.position>=3 && p.watchedSeconds>0,'Playback was not persisted'); return JSON.stringify({position:p.position,watched:p.watchedSeconds});
      });
      await check('resume','Reload lesson and verify the video resumes from saved progress',async()=>{
        const p=await state(); await page.reload(); await page.getByTestId('staged-lesson').waitFor();
        await page.waitForFunction(saved=>{const v=document.querySelector('video');return !!v && v.readyState>=1 && Math.abs(v.currentTime-saved)<2;},p.position,{timeout:30000});return `Resumed at ${p.position} seconds`;
      });
      await page.locator('video').evaluate(async video=>{video.muted=true;await video.play();});
      const duration=await page.locator('video').evaluate(v=>v.duration);
      assert(Number.isFinite(duration) && duration>0 && duration<3300,'Film duration outside runner budget');
      await page.waitForFunction(()=>document.querySelector('video')?.ended,null,{timeout:Math.min(3450000,duration*1000+120000)});
      await page.waitForTimeout(4000); const p=await state(); assert(p.watchedSeconds>=duration*.95,'Full watched time was not saved');
      return `Played ${duration.toFixed(2)}s film; saved ${p.watchedSeconds.toFixed(2)}s watched`;
    });
    for (const type of ['knowledge_check','guided_practice','independent_practice']) await check(type==='knowledge_check'?'knowledge_checks':type,`Submit authored ${type} response through learner UI and verify persistence`,async()=>{
      const activities=setup.snapshot.blueprint.activities.filter(a=>a.type===type); assert(activities.length,`No authored ${type}`);
      for(const activity of activities){const section=page.getByTestId(type).filter({has:page.getByText(activity.prompt,{exact:true})});
        await section.locator('textarea').fill(`QA practice response: ${activity.feedback}`); await section.getByRole('button',{name:'Submit practice'}).click();
        await section.getByRole('status').waitFor(); assert((await state()).activities?.[activity.id]?.answer,'Activity response not persisted');}
      return `${activities.length} authored activities submitted and read back`;
    });
    await check('scenario','Submit incorrect and corrected scenario decisions and verify server feedback',async()=>{
      const b=setup.snapshot.blueprint; assert(b.mistakes?.length,'No authored mistake/correction');
      const stage=b.stages.find(s=>s.stage==='mistake_and_correction'); assert(stage?.instruction,'Missing mistake teaching');
      assert(await page.getByText(stage.instruction,{exact:true}).isVisible(),'Corrected scenario not visible');
      const section=page.getByTestId('scenario'); await section.getByRole('button',{name:'Continue with the mistake'}).click();
      await section.getByRole('status').filter({hasText:'Review this decision'}).waitFor();assert((await state()).scenario?.passed===false,'Wrong scenario choice passed');
      await section.getByRole('button',{name:b.mistakes[0].correction,exact:true}).click();await section.getByRole('status').filter({hasText:'Correct decision'}).waitFor();
      assert((await state()).scenario?.passed===true,'Corrected decision did not persist');return 'Incorrect decision rejected; correction and feedback persisted';
    });
    await check('practical','Verify practical requirements cannot be awarded by a written QA response',async()=>{
      if(setup.snapshot.practicalRequired) throw new Error('Required practical submission and evaluation workflow must be exercised; not substituted with written practice');
      assert(await page.getByTestId('practical').count()===0,'Knowledge lesson falsely exposes practical completion');return 'Blueprint requires no practical evaluation; no practical credential awarded';
    });
    const questionSet=setup.snapshot.blueprint.assessment;
    async function answer(questions,correct){for(const q of questions){const field=page.locator('fieldset').filter({has:page.getByText(q.prompt,{exact:true})});await field.locator('input[type=radio]').nth(correct?q.answerIndex:(q.answerIndex+1)%q.choices.length).check();}await page.getByRole('button',{name:'Submit assessment',exact:true}).click();}
    await check('lesson_assessment','Submit incorrect answers and verify real server scoring',async()=>{await answer(questionSet.questions,false);await page.getByRole('status').filter({hasText:'Score: 0'}).waitFor();assert((await state()).assessment?.passed===false,'Wrong answers incorrectly passed');return 'Incorrect answers scored below threshold';});
    await check('remediation','Read required review and unlock reassessment through learner action',async()=>{await page.getByTestId('remediation').waitFor();await page.getByRole('button',{name:'I have reviewed the missed objectives'}).click();await page.getByTestId('reassessment').waitFor();assert((await state()).remediationReviewed===true,'Remediation not saved');return 'Review saved; separate reassessment unlocked';});
    await check('reassessment','Answer the distinct reassessment and read scored result',async()=>{assert(canonicalHash(questionSet.questions)!==canonicalHash(questionSet.reassessment),'Reassessment repeats original questions');await answer(questionSet.reassessment,true);await page.getByRole('status').filter({hasText:'Score: 100'}).waitFor();assert((await state()).reassessment?.passed===true,'Reassessment did not pass');return 'Distinct reassessment scored 100 and persisted';});
    await check('completion','Complete after playback and required activities; reload and verify persistence',async()=>{await page.getByRole('button',{name:'Complete lesson',exact:true}).click();await page.getByTestId('lesson-completed').waitFor();await page.reload();await page.getByTestId('lesson-completed').waitFor();assert((await state()).completed===true,'Completion not persistent');return 'Completion persisted across reload';});
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    const axe=await page.evaluate(async()=>window.axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    const violations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}));
    if (errors.length || violations.some(v=>['serious','critical'].includes(v.impact))) {
      const desktop = observations.find(o=>o.check==='desktop');
      if (desktop) { desktop.passed=false; desktop.observed=`Browser errors: ${JSON.stringify(errors)}; accessibility violations: ${JSON.stringify(violations)}`; }
    }
    const motion=await page.evaluate(()=>({preference:matchMedia('(prefers-reduced-motion: reduce)').matches,
      animated:[...document.querySelectorAll('main *')].some(e=>{const s=getComputedStyle(e);return s.animationName!=='none' && s.animationDuration.split(',').some(d=>parseFloat(d)>0);})}));
    const nonColor=await page.getByRole('status').filter({hasText:'Passed.'}).count()>0 && await page.getByTestId('lesson-completed').isVisible();
    const accessibility={contractVersion:input.contractVersion,semanticHeadings:!violations.some(v=>/heading/.test(v.id)),colorContrast:!violations.some(v=>v.id==='color-contrast'),nonColorMeaning:nonColor,screenReaderLabels:!violations.some(v=>/label|name/.test(v.id)),reducedMotion:motion.preference&&!motion.animated};
    const evidence={...input,testRunId:runId,stagedLesson:true,courseLesson:false,observations,checkedAt:new Date().toISOString(),accessibility,
      accessibilityViolations:violations,browserErrors:errors,durationSeconds:(Date.now()-startedAt)/1000,evidenceFiles:[]};
    await context.tracing.stop({path:path.join(directory,'trace.zip')});
    for (const upload of setup.uploads) {
      assert(['desktop.png','mobile.png','trace.zip'].includes(upload.filename),'Unexpected evidence filename');
      if (!await fs.stat(path.join(directory,upload.filename)).catch(()=>null)) continue;
      const target=new URL(upload.signedUrl);
      assert(target.protocol==='https:' && target.hostname==='cuxzzpsyufcewtmicszk.supabase.co','Unexpected evidence storage host');
      const result=await page.request.put(upload.signedUrl,{data:await fs.readFile(path.join(directory,upload.filename)),headers:{'content-type':upload.filename.endsWith('.png')?'image/png':'application/zip'}});
      assert(result.ok(),`Evidence upload failed: ${upload.filename}`);
      evidence.evidenceFiles.push({bucket:'ultimate-learner-evidence',path:upload.objectPath});
    }
    await fs.writeFile(path.join(directory,'evidence.json'),JSON.stringify(evidence,null,2),{mode:0o600});
    const result={evidence,signature:crypto.createHmac('sha256',secret).update(canonicalHash(evidence)).digest('hex')};
    const saved=await page.request.put(`${base.origin}/api/learner-testing/runs/${setup.runId}`,{headers:{authorization:`Bearer ${secret}`},data:result});
    assert(saved.ok(),'Signed learner evidence was not persisted');
    return result;
  } finally {
    for(const ctx of contexts) await ctx.close().catch(()=>{});
    if(setup){const clean=await browser.newContext();try{await clean.request.delete(`${base.origin}/api/learner-testing/runs/${setup.runId}`,{headers:{authorization:`Bearer ${secret}`}});}finally{await clean.close();}}
  }
}

export function learnerSetupReady(status, body) {
 return status === 404 && body?.error === "Lesson not found";
}
