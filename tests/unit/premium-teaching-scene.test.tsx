import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
vi.mock('remotion',()=>({
  AbsoluteFill:({children,...p}:any)=><div {...p}>{children}</div>,
  Audio:(p:any)=><audio src={p.src}/>, Img:(p:any)=><img {...p}/>, Video:(p:any)=><video {...p}/>,
  useCurrentFrame:()=>30,useVideoConfig:()=>({fps:30}),interpolate:()=>1,
}));
import {PremiumTeachingScene} from '../../remotion-src/compositions/PremiumTeachingScene';
const props:any={courseTitle:'Barber',lessonTitle:'Guard selection'};
const scene:any={scene_number:1,title:'Inspect the guard',bullets:['Check the teeth.'],narration:'Check the teeth.',audioSrc:'voice.mp3',imageUrl:'guard.png',clipUrl:null,durationFrames:120,captionCues:[{startSeconds:0,endSeconds:4,text:'Check the teeth.'}]};
describe('approved teaching slide',()=>{
  it('shows one complete photo with side instruction, audible narration and bottom caption',()=>{
    const html=renderToStaticMarkup(<PremiumTeachingScene scene={scene} props={props}/>);
    expect((html.match(/<img /g)||[]).length).toBe(1);
    expect(html).toContain('object-fit:contain');expect(html).toContain('left:1220px');
    expect(html).toContain('background:#171717');expect(html).toContain('bottom:0');
    expect(html).toContain('Check the teeth.');expect((html.match(/<audio /g)||[]).length).toBe(1);
  });
  it('mutes demo speech and replaces the photo instead of duplicating it',()=>{
    const html=renderToStaticMarkup(<PremiumTeachingScene scene={{...scene,clipUrl:'demo.mp4'}} props={props}/>);
    expect(html).toContain('<video');expect(html).toContain('muted=""');expect(html).not.toContain('<img ');
    expect((html.match(/<audio /g)||[]).length).toBe(1);
  });
});
