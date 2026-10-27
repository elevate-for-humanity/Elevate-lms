import type {TeachingVisualRequirement,UltimateMediaCandidate} from './media-director';
export interface UltimateMediaSource{search(requirement:TeachingVisualRequirement):Promise<UltimateMediaCandidate[]>;acquire(candidate:UltimateMediaCandidate):Promise<UltimateMediaCandidate>}
export interface UltimateMediaLibrary{store(input:{candidate:UltimateMediaCandidate;acquired:UltimateMediaCandidate}):Promise<UltimateMediaCandidate>}
type SourcedCandidate={candidate:UltimateMediaCandidate;source:UltimateMediaSource};
export async function acquireTeachingMedia(requirement:TeachingVisualRequirement,sources:UltimateMediaSource[],library?:UltimateMediaLibrary){
 const discovered:SourcedCandidate[]=[];
 for(const source of sources){for(const candidate of await source.search(requirement))discovered.push({candidate,source});}
 const ranked=discovered.filter(x=>x.candidate.licenseVerified).sort((a,b)=>b.candidate.matchScore-a.candidate.matchScore);
 const winner=ranked.find(x=>x.candidate.matchScore>=.9);if(!winner)return null;
 const acquired=await winner.source.acquire(winner.candidate);
 if(!acquired.licenseVerified)throw new Error('ULTIMATE_MEDIA_LICENSE_EVIDENCE_REQUIRED');
 return library?library.store({candidate:winner.candidate,acquired}):acquired;
}
