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

describe('photographic lesson assets without text-card generation', () => {
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
  it('rejects missing photograph identity instead of fabricating a card',()=>{
    const original:any=input();original.teachingPhotos={s0:[{imageUrl:'https://media.example.org/image.png'}]};
    expect(()=>bindTeachingPhotoAssignments(original)).toThrow('TEACHING_PHOTO_EVIDENCE_REQUIRED');
  });
});
