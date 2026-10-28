import { AbsoluteFill, Audio, Img, Video, Sequence, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneData, SlideLessonProps } from './SlideLesson';
import { measuredTeachingStep } from '../../lib/ultimate-course-builder/instructional/approved-presentation.mjs';
import { activePictureCue, quoteStartSeconds } from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';

/** Whole photographs change on the speech timeline. Inspected motion footage
 * stays muted; illustrations never stand in for a practical demonstration. */
export function PremiumTeachingScene({scene,props}:{scene:SceneData;props:SlideLessonProps}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),seconds=frame/fps;
 const fade=(start:number,duration=.75)=>interpolate(seconds,[start,start+duration],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const steps=scene.teachingVisual?.steps??scene.bullets.map((value,i)=>({label:'Step '+(i+1),value,narrationQuote:value}));
 const speechCues=scene.wordAlignment?.map(w=>({text:w.word,startSeconds:w.start,endSeconds:w.end}))??scene.captionCues??[];
 const stepIndex=measuredTeachingStep(steps,speechCues,seconds);
 const step=steps[stepIndex];
 const recap=scene.recapStartSeconds!==undefined&&seconds>=scene.recapStartSeconds;
 const caption=scene.captionCues?.find(c=>seconds>=c.startSeconds&&seconds<c.endSeconds)?.text??'';
 const cues=scene.pictureCues;
 const cue=cues?.length?activePictureCue(cues,seconds):null;
 const cueIndex=cue?cues!.indexOf(cue):-1,previous=cueIndex>0?cues![cueIndex-1]:null;
 const pictureFade=(start:number)=>interpolate(seconds,[start,start+.1],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const whole={width:'100%',height:'100%',objectFit:'contain' as const};
 const demonstration=Boolean(scene.clipUrl)&&Boolean(scene.motionCue)&&seconds>=scene.motionCue!.startSeconds&&seconds<scene.motionCue!.endSeconds&&!recap;
 // Keep the whole teaching photograph visible while the camera gently tracks
 // it. A contained, slightly inset image preserves tools and hands at the edges.
 // One continuous camera move per picture instead of oscillating sine/cosine
 // motion. Repeated cycles were visually indistinguishable from timeline replay.
 const pictureStart=cue?.startSeconds??0;
 const pictureEnd=cue?.endSeconds??Math.max(1,scene.durationFrames/fps);
 const pictureProgress=Math.max(0,Math.min(1,(seconds-pictureStart)/Math.max(0.1,pictureEnd-pictureStart)));
 const photoMotion=`translate(${(-0.8+pictureProgress*1.6).toFixed(3)}%, ${(-0.35+pictureProgress*0.7).toFixed(3)}%) scale(${(0.975+pictureProgress*0.02).toFixed(4)})`;
 const photo=(url:string,opacity=1)=><Img src={url} style={{...whole,position:'absolute',inset:0,opacity,transform:photoMotion}}/>;
 const textStart=recap?scene.recapStartSeconds!:step?.narrationQuote?quoteStartSeconds(step.narrationQuote,speechCues):0;
 return <AbsoluteFill style={{background:'#171717',color:'#fff',fontFamily:'Arial, sans-serif'}}>
  <div style={{position:'absolute',top:30,left:54,color:'#cdb795',fontSize:22,letterSpacing:2}}>{props.courseTitle}</div>
  <div style={{position:'absolute',top:78,left:54,right:54,display:'flex',gap:24,alignItems:'center'}}>
   <span style={{fontSize:42,color:'#cdb795'}}>{String(scene.scene_number).padStart(2,'0')}</span>
   <h1 style={{fontSize:60,lineHeight:1.15,margin:0}}>{recap?'Recap: ':''}{scene.title}</h1>
  </div>
  <div style={{position:'absolute',left:54,top:210,width:1120,height:670,background:'#171717',borderRadius:12,overflow:'hidden'}}>
   {demonstration?<div style={{position:'absolute',top:0,left:0,right:0,height:cue?445:670}}>
     <Sequence from={Math.round(scene.motionCue!.startSeconds*fps)} durationInFrames={Math.max(1,Math.round((scene.motionCue!.endSeconds-scene.motionCue!.startSeconds)*fps))}>
      <Video src={scene.clipUrl!} muted style={whole}/>
     </Sequence>
    </div>:null}
   <div style={{position:'absolute',top:demonstration&&cue?465:0,left:0,right:0,height:demonstration&&cue?205:670}}>
    {cue?<>
     {previous&&photo(previous.imageUrl)}
     {photo(cue.imageUrl,previous&&props.visualStyle?.transition!=='cut'?pictureFade(cue.startSeconds):1)}
    </>:!demonstration&&scene.imageUrl?photo(scene.imageUrl):null}
   </div>
  </div>
  <div style={{position:'absolute',left:1220,right:54,top:225,height:640,display:'flex',flexDirection:'column',justifyContent:'center',gap:28,opacity:fade(textStart,scene.teachingVisual?.transitionSeconds??.75)}}>
   <div style={{fontSize:!recap&&(step?.label?.length??0)>30?40:48,color:'#cdb795',lineHeight:1.25}}>{recap?'Fresh recap':String(stepIndex+1).padStart(2,'0')+'  '+step?.label}</div>
   <div style={{fontSize:recap?56:(step?.value?.length??0)>100?52:64,lineHeight:1.25}}>{recap?scene.recapText:step?.value}</div>
   <div style={{fontSize:22,color:'#cdb795'}}>{demonstration?'Inspected motion demonstration excerpt.':'Illustration — practice with your instructor.'}</div>
  </div>
  <div style={{position:'absolute',bottom:0,left:0,right:0,height:180,background:'#080808',borderTop:'2px solid #cdb795',display:'flex',alignItems:'center',justifyContent:'center',padding:'14px 70px',boxSizing:'border-box',color:'#ffffff',fontSize:60,fontWeight:700,lineHeight:1.25,textAlign:'center',textShadow:'0 2px 4px #000'}}>{caption}</div>
  {scene.audioSrc&&<Audio src={scene.audioSrc} volume={1}/>}
 </AbsoluteFill>;
}
