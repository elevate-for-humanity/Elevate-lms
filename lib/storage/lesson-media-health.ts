import { GetBucketAclCommand } from '@aws-sdk/client-s3';
import { getElevateMediaStorageConfig, getElevateMediaStorageClient, isElevateMediaStorageConfigured } from './elevate-media-storage';
import type { ServiceCheck } from '@/lib/platform/platform-health';

/** A Supabase metadata check cannot establish private lesson-media readiness. */
export async function checkLessonMediaStorage(): Promise<ServiceCheck> {
  const name = 'Lesson media (Backblaze B2)';
  const config = getElevateMediaStorageConfig();
  const configured = isElevateMediaStorageConfigured() && config.provider === 'backblaze-b2' &&
    /^https:\/\/s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(config.endpoint || '') && config.bucket === 'elevate-course-media';
  if (!configured) return {name,status:'unknown',configured:false,message:'The approved Backblaze lesson-media connection is not configured in this runtime'};
  const start = Date.now();
  try {
    const acl = await getElevateMediaStorageClient().send(new GetBucketAclCommand({Bucket:config.bucket}), {abortSignal:AbortSignal.timeout(3500)});
    const owner = acl.Owner?.ID;
    const privateBucket = Boolean(owner && acl.Grants?.length && acl.Grants.every(grant =>
      grant.Grantee?.Type === 'CanonicalUser' && grant.Grantee.ID === owner && grant.Permission === 'FULL_CONTROL'));
    return {name,status:privateBucket?'healthy':'degraded',configured:true,latencyMs:Date.now()-start,
      message:privateBucket?'Private B2 bucket responding. Legacy lesson migration and playback are checked separately.':'Bucket privacy could not be verified; inspect its access controls'};
  } catch {
    return {name,status:'degraded',configured:true,latencyMs:Date.now()-start,message:'Backblaze connectivity or bucket privacy verification failed'};
  }
}
