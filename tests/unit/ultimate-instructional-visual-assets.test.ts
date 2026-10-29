import { describe, expect, it, vi } from 'vitest';
import { bindTeachingPhotoAssignments } from '@/lib/ultimate-course-builder/adapters/teaching-photo-assignments.mjs';
import { prepareUltimateStoryboardInput } from '@/lib/ultimate-course-builder/adapters/platform-renderer';
import { produceTeachingVisual } from '@/lib/ultimate-course-builder/instructional/teaching-visual';

function input() {
  const scenes = Array.from({ length: 13 }, (_, i) => {
    const text = `Record the actual duration for procedure ${i + 1}. Ask the designated reviewer to check the entry.`;
    return {
      id: `s${i}`,
      dialogue: text,
      teachingPoint: text,
      teachingVisual: produceTeachingVisual(text, 'practice'),
    };
  });
  return {
    artifacts: {
      storyboard: { storyboard: { scenes } },
      visual_assignment: {
        media: {
          readyAssets: [],
          assignments: scenes.map((s) => ({
            sceneId: s.id,
            assetId: `instructional:${s.id}`,
            assignmentMethod: 'instructional-render',
            generatedInstructionalVisual: true,
          })),
        },
      },
    },
  };
}

describe('shared instructional visual assets', () => {
  it('binds actual prepared photographs to saved scene requests', () => {
    const original:any=input();
    original.teachingPhotos=Object.fromEntries(original.artifacts.storyboard.storyboard.scenes.map((scene:any,i:number)=>[scene.id,[{
      imageUrl:'https://media.example.org/photo-'+i+'.png',storagePath:'approved-teaching-photos/'+i+'.png',
      sha256:i.toString(16).padStart(64,'0'),narrationQuote:scene.dialogue,provider:'google',illustration:true,
    }]]));
    const actual=bindTeachingPhotoAssignments(original);
    const prepared=prepareUltimateStoryboardInput(actual);
    expect((prepared.sceneData as any).scenes).toHaveLength(13);
    expect((prepared.sceneData as any).scenes.every((s:any)=>s.reference_image_url && s.resolved_model==='generated-teaching-photograph')).toBe(true);
    expect(actual.artifacts.visual_assignment.media.readyAssets.every((a:any)=>a.provider!=='remotion')).toBe(true);
    expect(original.artifacts.visual_assignment.media.readyAssets).toEqual([]);
  });
  it('does not turn old text-card requests into approved image assets',()=>{
    const actual=bindTeachingPhotoAssignments(input());
    expect(actual.artifacts.visual_assignment.media.readyAssets).toEqual([]);
    expect(()=>prepareUltimateStoryboardInput(actual)).toThrow('ULTIMATE_RENDER_SAVED_ASSIGNMENT_REQUIRED');
  });
  it('binds the shared visual-neutral request to a clearly identified instructional graphic',()=>{
    const original:any=input();
    original.artifacts.visual_assignment.media.assignments[0]={
      sceneId:'s0',assetId:'instructional-visual-request:s0',
      assignmentMethod:'instructional-visual-request',requestedInstructionalVisual:true,
      relevanceReason:'Instructional visual supporting the narration',
    };
    original.teachingPhotos={s0:[{
      imageUrl:'https://media.example.org/card.png',storagePath:'approved-teaching-photos/card.png',
      sha256:'a'.repeat(64),narrationQuote:original.artifacts.storyboard.storyboard.scenes[0].dialogue,
      provider:'elevate-instructional',repair:{method:'lesson-conceptual-card-v1'},
    }]};
    const actual=bindTeachingPhotoAssignments(original);
    expect(actual.artifacts.visual_assignment.media.assignments[0]).toMatchObject({
      assignmentMethod:'instructional-visual',generatedInstructionalVisual:true,
    });
    expect(actual.artifacts.visual_assignment.media.readyAssets[0]).toMatchObject({
      owned_instructional_visual:true,teaching_photo:false,
    });
  });
  it('rejects missing visual identity instead of fabricating evidence',()=>{
    const original:any=input();original.teachingPhotos={s0:[{imageUrl:'https://media.example.org/image.png'}]};
    expect(()=>bindTeachingPhotoAssignments(original)).toThrow('INSTRUCTIONAL_VISUAL_EVIDENCE_REQUIRED');
  });
});
