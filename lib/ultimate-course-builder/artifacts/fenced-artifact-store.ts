import type {SupabaseClient} from '@supabase/supabase-js';
import {UltimateArtifactStore} from './artifact-store';

/** Version allocation, lease validation and the lesson scope share one commit. */
export class UltimateFencedArtifactStore extends UltimateArtifactStore {
  constructor(private client:SupabaseClient,private fence:{jobId:string;workerId:string;generation:number}) {super(client);}
  override async createVersion(input:Parameters<UltimateArtifactStore['createVersion']>[0]) {
    const {data,error} = await this.client.rpc('ultimate_fenced_artifact_version',{
      p_job:this.fence.jobId,p_worker:this.fence.workerId,p_generation:this.fence.generation,p_input:input,
    });
    if (error) throw error;
    if (!data?.id || !Number.isInteger(data.version)) throw Error('ULTIMATE_ARTIFACT_VERSION_NOT_PERSISTED');
    return data;
  }
}
