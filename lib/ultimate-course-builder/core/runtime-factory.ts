import {UltimateSupabasePersistence} from '../persistence/supabase-persistence';
import {UltimateFencedPersistence} from '../persistence/fenced-persistence';
import {UltimateArtifactStore} from '../artifacts/artifact-store';
import {UltimateFencedArtifactStore} from '../artifacts/fenced-artifact-store';
import {UltimatePlatformWorkforce} from '../adapters/platform-workforce';
import {UltimatePlatformCredential} from '../adapters/platform-credential';
import {UltimatePlatformInstructionalGenerator} from '../adapters/platform-instructional-generator';
import {UltimatePlatformMedia} from '../adapters/platform-media';
import {UltimatePlatformAssessment} from '../adapters/platform-assessment';
import {UltimatePlatformLearnerRuntime} from '../adapters/platform-learner-runtime';
import type {UltimateRuntime} from './runtime';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {UltimateNarrationPort,UltimateRenderPort} from './ports';

class LazyNarration implements UltimateNarrationPort{
  async generate(input:unknown){
    const {UltimatePlatformNarration}=await import('../adapters/platform-narration');
    return new UltimatePlatformNarration().generate(input);
  }
}
class LazyRenderer implements UltimateRenderPort{
  constructor(private db:SupabaseClient){}
  async render(input:unknown){
    const {UltimatePlatformRenderer}=await import('../adapters/platform-renderer');
    return new UltimatePlatformRenderer(this.db).render(input);
  }
}
export async function createUltimateRuntime(db:SupabaseClient, fence?: {jobId:string;workerId:string;generation:number}):Promise<UltimateRuntime>{
  return {
    persistence:fence ? new UltimateFencedPersistence(db,fence.jobId,fence.workerId,fence.generation) : new UltimateSupabasePersistence(db as any),
    artifacts:fence ? new UltimateFencedArtifactStore(db,fence) : new UltimateArtifactStore(db as any),
    workforce:new UltimatePlatformWorkforce(),
    credential:new UltimatePlatformCredential(db as any),
    instructional:new UltimatePlatformInstructionalGenerator(),
    media:new UltimatePlatformMedia(db as any),
    narration:new LazyNarration(),
    renderer:new LazyRenderer(db),
    assessment:new UltimatePlatformAssessment(),
    learner:new UltimatePlatformLearnerRuntime(db as any)
  };
}
