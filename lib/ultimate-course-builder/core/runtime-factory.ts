import {UltimateSupabasePersistence} from '../persistence/supabase-persistence';
import {UltimateArtifactStore} from '../artifacts/artifact-store';
import {UltimatePlatformWorkforce} from '../adapters/platform-workforce';
import {UltimatePlatformCredential} from '../adapters/platform-credential';
import {UltimatePlatformInstructionalGenerator} from '../adapters/platform-instructional-generator';
import {UltimatePlatformMedia} from '../adapters/platform-media';
import {UltimatePlatformAssessment} from '../adapters/platform-assessment';
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
  async render(input:unknown){
    const {UltimatePlatformRenderer}=await import('../adapters/platform-renderer');
    return new UltimatePlatformRenderer().render(input);
  }
}
export async function createUltimateRuntime(db:SupabaseClient):Promise<UltimateRuntime>{
  return {
    persistence:new UltimateSupabasePersistence(db as any),
    artifacts:new UltimateArtifactStore(db as any),
    workforce:new UltimatePlatformWorkforce(),
    credential:new UltimatePlatformCredential(db as any),
    instructional:new UltimatePlatformInstructionalGenerator(),
    media:new UltimatePlatformMedia(db as any),
    narration:new LazyNarration(),
    renderer:new LazyRenderer(),
    assessment:new UltimatePlatformAssessment()
  };
}
