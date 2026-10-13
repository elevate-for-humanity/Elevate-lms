import { AbsoluteFill, Audio, Img, Video, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneData, SlideLessonProps } from './SlideLesson';
import { measuredTeachingStep } from '../../lib/ultimate-course-builder/instructional/approved-presentation.mjs';

/** One whole visual and its explanation. The licensed demonstration remains
 * muted so it cannot overlap the approved instructor voice. */
export function PremiumTeachingScene({ scene, props }: { scene: SceneData; props: SlideLessonProps }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = (delay: number) => interpolate(frame, [delay, delay + fps * .75], [.35, 1], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const steps = scene.teachingVisual?.steps ?? scene.bullets.map((value, i) => ({label:`Step ${i+1}`,value}));
  const stepIndex = measuredTeachingStep(steps,scene.captionCues ?? [],frame/fps);
  const step = steps[stepIndex];
  const caption = scene.captionCues?.find(c => frame/fps >= c.startSeconds && frame/fps < c.endSeconds)?.text ?? '';
  const mediaStyle = { width:'100%',height:'100%',objectFit:(props.visualStyle?.cropMode === 'cover-safe' ? 'cover' : 'contain') as 'cover' | 'contain' };
  return <AbsoluteFill style={{background:'#171717',color:'#fff',fontFamily:'Arial, sans-serif'}}>
    <div style={{position:'absolute',top:30,left:54,color:'#cdb79e',fontSize:22,letterSpacing:2}}>{props.courseTitle}</div>
    <div style={{position:'absolute',top:78,left:54,right:54,display:'flex',gap:24,alignItems:'center'}}>
      <span style={{fontSize:42,color:'#cdb79e',opacity:fade(0)}}>{String(scene.scene_number).padStart(2,'0')}</span>
      <h1 style={{fontSize:46,lineHeight:1.15,margin:0,opacity:fade(fps*.15)}}>{scene.title}</h1>
    </div>
    <div style={{position:'absolute',left:54,top:210,width:1120,height:710,background:'#eee7dd',borderRadius:12,overflow:'hidden',opacity:fade(0)}}>
      {scene.clipUrl ? <Video src={scene.clipUrl} muted style={mediaStyle}/> : scene.imageUrl ? <Img src={scene.imageUrl} style={mediaStyle}/> : null}
    </div>
    <div style={{position:'absolute',left:1220,right:54,top:225,height:680,display:'flex',flexDirection:'column',justifyContent:'center',gap:28,opacity:fade(fps*.3)}}>
      <div style={{fontSize:32,color:'#cdb79e',lineHeight:1.25}}>{step?.label}</div>
      <div style={{fontSize:38,lineHeight:1.4}}>{step?.value}</div>
      <div style={{fontSize:23,color:'#cdb79e'}}>Teaching point {stepIndex+1} of {steps.length}</div>
    </div>
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:125,background:'#080808',borderTop:'2px solid #cdb79e',display:'flex',alignItems:'center',justifyContent:'center',padding:'14px 70px',boxSizing:'border-box',fontSize:36,lineHeight:1.3,textAlign:'center'}}>{caption}</div>
    {scene.audioSrc && <Audio src={scene.audioSrc} volume={1}/>}
  </AbsoluteFill>;
}
