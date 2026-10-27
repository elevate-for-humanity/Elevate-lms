/** Standalone compositor regression. This does NOT certify a course or replace
 * authenticated learner acceptance, licensed footage, narration or publication.
 * Run: node --import=tsx scripts/verify-blueprint-teaching-display.tsx BLUEPRINT
 * Uses the repository's existing Playwright dependency, not a new service. */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { BlueprintTeachingGraphic } from '../remotion-src/compositions/BlueprintTeachingGraphic';
import { teachingPresentation } from '../lib/ultimate-course-builder/instructional/teaching-presentation';
import { validateTeachingVisual } from '../lib/ultimate-course-builder/instructional/teaching-visual';
import type { LessonBlueprint } from '../lib/ultimate-course-builder/instructional/lesson-blueprint';

const exec = promisify(execFile);
const words = (value: string) => new Set((value.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(word => word.length > 2));
const coverage = (expected: string, decoded: string) => {
  const wanted = words(expected), actual = words(decoded);
  return wanted.size ? [...wanted].filter(word => actual.has(word)).length / wanted.size : 0;
};

async function main() {
  const blueprint: LessonBlueprint = JSON.parse(await readFile(resolve(process.argv[2] ?? 'docs/ultimate-course-builder/lessons/cosmetology-welcome.blueprint.json'), 'utf8'));
  const directory = await mkdtemp(join(tmpdir(), 'teaching-display-'));
  const browser = await chromium.launch({headless:true,
    ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),
  });
  const states: Array<{sceneId:string;step:number;expected:string;file:string}> = [];
  try {
    const page = await browser.newPage({viewport:{width:1920,height:1080}});
    for (const scene of blueprint.segments) {
      if (!scene.teachingVisual) throw new Error(`TEACHING_PLAN_REQUIRED:${scene.id}`);
      const plan = scene.teachingVisual;
      validateTeachingVisual(plan, scene.text);
      for (let step = 0; step < plan.steps.length; step++) {
        const presentation = teachingPresentation(plan, step + 0.5, plan.steps.length);
        const graphic = renderToStaticMarkup(<div id="panel" style={{position:'absolute',top:80,left:60,right:60,bottom:100,display:'flex',flexDirection:'column',justifyContent:'center',gap:20}}>
          <div style={{fontFamily:'sans-serif',fontSize:80,fontWeight:900,lineHeight:1.2}}>{scene.stage.replace(/_/g,' ')}</div>
          <BlueprintTeachingGraphic plan={plan} seconds={step+0.5} duration={plan.steps.length} color="#123456" />
        </div>);
        await page.setContent(`<html><body style="margin:0;background:#e2e8f0">${graphic}</body></html>`);
        const overflow = await page.evaluate(() => {
          const panel = document.querySelector('#panel')!.getBoundingClientRect();
          const box = document.querySelector('[data-teaching-kind]')!.getBoundingClientRect();
          return box.top < panel.top || box.bottom > panel.bottom || box.left < panel.left || box.right > panel.right;
        });
        if (overflow) throw new Error(`TEACHING_DISPLAY_CLIPPED:${scene.id}:${step}`);
        const file = `state-${String(states.length).padStart(3,'0')}.png`;
        await page.screenshot({path:join(directory,file)});
        states.push({sceneId:scene.id,step,expected:presentation.expectedText,file});
      }
    }
  } finally { await browser.close(); }
  if (!states.length) throw new Error('TEACHING_STATES_REQUIRED');
  const video = join(directory, 'standalone-display-regression.mp4');
  await exec('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','2','-i',join(directory,'state-%03d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p',video],{timeout:60000});
  const evidence = [];
  for (const [index,state] of states.entries()) for (const width of [1280,390]) {
    const frame = join(directory,`ocr-${index}-${width}.png`);
    // Exact frame timestamps: a midpoint seek at 2fps may select the next state.
    await exec('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(index/2),'-i',video,'-frames:v','1','-vf',`scale=${width}:-1`,frame],{timeout:30000});
    let decoded = (await exec('tesseract',[frame,'stdout','--psm','11'],{timeout:30000})).stdout;
    let wordCoverage = coverage(state.expected,decoded);
    let mode = 11;
    if (wordCoverage < 0.85) {
      const block = (await exec('tesseract',[frame,'stdout','--psm','6'],{timeout:30000})).stdout;
      if (coverage(state.expected,block) > wordCoverage) { decoded=block;wordCoverage=coverage(state.expected,block);mode=6; }
    }
    evidence.push({...state,width,decoded,wordCoverage,mode});
  }
  await writeFile(join(directory,'evidence.json'),JSON.stringify(evidence,null,2));
  const failures = evidence.filter(row => row.wordCoverage < 0.85);
  console.log(JSON.stringify({scope:'standalone teaching display; not learner acceptance',states:states.length,checks:evidence.length,failures:failures.length,directory}));
  if (failures.length) throw new Error(`TEACHING_DISPLAY_OCR_FAILED:${failures.length}`);
}
main().catch(error => {console.error(error);process.exitCode=1;});
