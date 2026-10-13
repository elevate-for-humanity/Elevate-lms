import { AbsoluteFill, Audio, Img, Video, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneData, SlideLessonProps } from './SlideLesson';
import { measuredTeachingStep } from '../../lib/ultimate-course-builder/instructional/approved-presentation.mjs';
import { activePictureCue, quoteStartSeconds } from '../../lib/ultimate-course-builder/instructional/picture-timeline.mjs';

/** Whole photographs change on the speech timeline. Inspected motion footage
 * stays muted; illustrations never stand in for a practical demonstration. */
export function PremiumTeachingScene({scene,props}:{scene:SceneData;props:SlideLessonProps}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),seconds=frame/fps;
 const fade=(start:number)=>interpolate(seconds,[start,start+.75],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const steps=scene.teachingVisual?.steps??scene.bullets.map((value,i)=>({label:'Step '+(i+1),value,narrationQuote:value}));
 const stepIndex=measuredTeachingStep(steps,scene.captionCues??[],seconds);
 const step=steps[stepIndex];
 const recap=scene.recapStartSeconds!==undefined&&seconds>=scene.recapStartSeconds;
 const caption=scene.captionCues?.find(c=>seconds>=c.startSeconds&&seconds<c.endSeconds)?.text??'';
 const cues=scene.pictureCues;
 const cue=cues?.length?activePictureCue(cues,seconds):null;
 const cueIndex=cue?cues!.indexOf(cue):-1,previous=cueIndex>0?cues![cueIndex-1]:null;
 const whole={width:'100%',height:'100%',objectFit:'contain' as const};
 const demonstration=Boolean(scene.clipUrl)&&!recap;
 const photo=(url:string,opacity=1)=><Img src={url} style={{...whole,position:'absolute',inset:0,opacity}}/>;
 const textStart=recap?scene.recapStartSeconds!:step?.narrationQuote?quoteStartSeconds(step.narrationQuote,scene.captionCues??[]):0;
 return <AbsoluteFill style={{background:'#171717',color:'#fff',fontFamily:'Arial, sans-serif'}}>
  <div style={{position:'absolute',top:30,left:54,color:'#cdb795',fontSize:22,letterSpacing:2}}>{props.courseTitle}</div>
  <div style={{position:'absolute',top:78,left:54,right:54,display:'flex',gap:24,alignItems:'center'}}>
   <span style={{fontSize:42,color:'#cdb795'}}>{String(scene.scene_number).padStart(2,'0')}</span>
   <h1 style={{fontSize:46,lineHeight:1.15,margin:0}}>{recap?'Recap: ':''}{scene.title}</h1>
  </div>
  <div style={{position:'absolute',left:54,top:210,width:1120,height:710,background:'#171717',borderRadius:12,overflow:'hidden'}}>
   {demonstration?<div style={{position:'absolute',top:0,left:0,right:0,height:cue?490:710}}>
     <Video src={scene.clipUrl!} muted style={whole}/>
    </div>:null}
   <div style={{position:'absolute',top:demonstration&&cue?510:0,left:0,right:0,height:demonstration&&cue?200:710}}>
    {cue?<>
     {previous&&photo(previous.imageUrl)}
     {photo(cue.imageUrl,previous&&props.visualStyle?.transition!=='cut'?fade(cue.startSeconds):1)}
    </>:!demonstration&&scene.imageUrl?photo(scene.imageUrl):null}
   </div>
  </div>
  <div style={{position:'absolute',left:1220,right:54,top:225,height:680,display:'flex',flexDirection:'column',justifyContent:'center',gap:28,opacity:fade(textStart)}}>
   <div style={{fontSize:32,color:'#cdb795',lineHeight:1.25}}>{recap?'Fresh recap':String(stepIndex+1).padStart(2,'0')+'  '+step?.label}</div>
   <div style={{fontSize:recap?32:38,lineHeight:1.35}}>{recap?scene.recapText:step?.value}</div>
   <div style={{fontSize:22,color:'#cdb795'}}>Illustrations support learning; complete observed practice with your instructor.</div>
  </div>
  <div style={{position:'absolute',bottom:0,left:0,right:0,height:125,background:'#080808',borderTop:'2px solid #cdb795',display:'flex',alignItems:'center',justifyContent:'center',padding:'14px 70px',boxSizing:'border-box',fontSize:36,lineHeight:1.3,textAlign:'center'}}>{caption}</div>
  {scene.audioSrc&&<Audio src={scene.audioSrc} volume={1}/>}
 </AbsoluteFill>;
}
