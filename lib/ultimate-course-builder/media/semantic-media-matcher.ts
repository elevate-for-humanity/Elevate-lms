import type {TeachingVisualRequirement,UltimateMediaCandidate} from './media-director';
export interface MediaEvidence{candidate:UltimateMediaCandidate;actionMatch:number;subjectMatch:number;shotMatch:number;evidenceMatch:number;quality:number}
export function rankMedia(requirement:TeachingVisualRequirement,evidence:MediaEvidence[]){return evidence.map(e=>({...e,score:(e.actionMatch*.3)+(e.subjectMatch*.2)+(e.shotMatch*.1)+(e.evidenceMatch*.3)+(e.quality*.1)})).filter(e=>e.candidate.licenseVerified&&e.score>=.9).sort((a,b)=>b.score-a.score);}
