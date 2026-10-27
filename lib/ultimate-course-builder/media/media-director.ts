export interface TeachingVisualRequirement{cueId:string;objectiveId:string;narration:string;action:string;subject:string;shot:'wide'|'medium'|'close-up'|'diagram';evidence:string}
export interface UltimateMediaCandidate{id:string;url:string;source:'licensed-library'|'envato'|'owned'|'generated'|'diagram';licenseVerified:boolean;matchScore:number}
export function selectTeachingMedia(r:TeachingVisualRequirement,c:UltimateMediaCandidate[]){return c.filter(x=>x.licenseVerified&&x.matchScore>=.9).sort((a,b)=>b.matchScore-a.matchScore)[0]??null;}
