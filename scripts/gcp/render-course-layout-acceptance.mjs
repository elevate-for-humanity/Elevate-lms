import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

// Layout regression evidence only. This is not a course video or learner acceptance.
const output='/tmp/render-acceptance';
await mkdir(output,{recursive:true});
const steps=[{label:'Clarify the request',value:'Confirm the requested service and explain the next step.',narrationQuote:'Confirm the requested service and explain the next step.'},
  {label:'Explain the options',value:'Describe the options and invite questions before proceeding.',narrationQuote:'Describe the options and invite questions before proceeding.'},
  {label:'Confirm understanding',value:'Ask the client to confirm the agreed service.',narrationQuote:'Ask the client to confirm the agreed service.'}];
const inputProps={courseTitle:'Layout regression',lessonTitle:'Instructional display regression',primaryColor:'#a855f7',accentColor:'#3b82f6',backgroundColor:'#0f172a',surfaceMode:'bright',scenes:[{
  scene_number:1,title:'Client consultation',bullets:[],narration:steps.map(s=>s.value).join(' '),clip_keyword:'',clipUrl:null,
  imageUrl:'https://media.example/instructional.png',imageIsInstructional:true,audioSrc:null,durationFrames:600,strictBlueprint:true,
  teachingVisual:{kind:'sequence',steps},captionCues:steps.map((s,i)=>({startSeconds:i*20/3,endSeconds:(i+1)*20/3,text:s.value})),
}]};
const serveUrl=await bundle({entryPoint:'/app/remotion-src/index.ts'});
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE;
const composition=await selectComposition({serveUrl,id:'SlideLesson',inputProps,browserExecutable});
const evidence=[];
for(const [index,frame] of [150,360,600].entries()) {
  for(const scale of [1,0.2]) {
    const path=`${output}/step-${index}-${scale===1?'desktop':'mobile'}.png`;
    await renderStill({serveUrl,composition,inputProps,browserExecutable,frame,scale,output:path});
    const teachingPath=path.replace('.png','-teaching.png');
    execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path,'-vf','crop=iw:ih*0.7:0:0',teachingPath]);
    const decoded=execFileSync('tesseract',[teachingPath,'stdout','--psm','11'],{encoding:'utf8'}).toLowerCase();
    const expected=(steps[index].label+' '+steps[index].value).toLowerCase().match(/[a-z]+/g);
    const found=new Set(decoded.match(/[a-z]+/g));
    const coverage=expected.filter(word=>found.has(word)).length/expected.length;
    evidence.push({step:index,scale,wordCoverage:coverage});
    if(coverage<0.85) throw new Error(`Layout regression OCR below 85%:${JSON.stringify({step:index,scale,coverage,expected,decoded})}`);
  }
}
await writeFile(`${output}/evidence.json`,JSON.stringify({purpose:'layout-regression-only',evidence},null,2));
console.log(JSON.stringify({purpose:'layout-regression-only',evidence}));
