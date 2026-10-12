import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
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
// A solid owned test pattern checks compositor geometry, not instruction or licensing.
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=0xc82038:s=960x540:r=30:d=20','-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',`${output}/synthetic-layout-pattern.mp4`]);
const pattern='data:video/mp4;base64,'+(await readFile(`${output}/synthetic-layout-pattern.mp4`)).toString('base64');
const evidence=[];
for(const mode of ['theory','physical']) {
  const props=mode==='theory'?inputProps:{...inputProps,scenes:[{...inputProps.scenes[0],clipUrl:pattern,imageUrl:null,imageIsInstructional:false,physicalDemonstration:true}]};
for(const [index,frame] of [150,360,600].entries()) {
  for(const scale of [1,0.2]) {
    const path=`${output}/${mode}-step-${index}-${scale===1?'desktop':'mobile'}.png`;
    await renderStill({serveUrl,composition,inputProps:props,browserExecutable,frame,scale,output:path});
    const teachingPath=path.replace('.png','-teaching.png');
    execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',path,'-vf','crop=iw:ih*0.7:0:0',teachingPath]);
    let decoded=execFileSync('tesseract',[teachingPath,'stdout','--psm','11'],{encoding:'utf8'}).toLowerCase();
    const expected=(steps[index].label+' '+steps[index].value).toLowerCase().match(/[a-z]+/g);
    const coverageOf=text=>{const found=new Set(text.match(/[a-z]+/g));return expected.filter(word=>found.has(word)).length/expected.length;};
    let coverage=coverageOf(decoded),ocrMode='sparse';
    if(coverage<0.85){const block=execFileSync('tesseract',[teachingPath,'stdout','--psm','6'],{encoding:'utf8'}).toLowerCase();if(coverageOf(block)>coverage){decoded=block;coverage=coverageOf(block);ocrMode='block';}}
    const item={mode,step:index,scale,wordCoverage:coverage,ocrMode};
    if(mode==='physical'){
      const rgb=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',path,'-vf',`crop=2:2:${Math.floor(1920*scale*0.75)}:${Math.floor(1080*scale*0.4)}`,'-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
      item.sourceRegionVisible=rgb[0]>180&&rgb[1]<85&&rgb[2]<100;
      if(!item.sourceRegionVisible) throw new Error('Physical demonstration region is obscured by the teaching graphic');
    }
    evidence.push(item);
    await writeFile(`${output}/evidence.json`,JSON.stringify({purpose:'layout-regression-only',evidence},null,2));
    if(coverage<0.85) throw new Error(`Layout regression OCR below 85%:${JSON.stringify({mode,step:index,scale,coverage,expected,decoded})}`);
  }
}
}
await writeFile(`${output}/evidence.json`,JSON.stringify({purpose:'layout-regression-only',evidence},null,2));
console.log(JSON.stringify({purpose:'layout-regression-only',evidence}));
