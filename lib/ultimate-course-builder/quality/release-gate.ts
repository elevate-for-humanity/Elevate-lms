export interface UltimateQualityEvidence{media:boolean;instructional:boolean;narration:boolean;learnerRunthrough:boolean;credentialTraceability:boolean}
export function canRelease(e:UltimateQualityEvidence){return Object.values(e).every(Boolean);}
