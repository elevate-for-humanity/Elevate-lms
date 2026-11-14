export interface UltimateWorkforceEvidence{socCodes:string[];tasks:string[];skills:string[];knowledge:string[];technologySkills:string[];careerOutcomes:string[];sources:string[]}
export function emptyWorkforceEvidence(socCodes:string[]=[]):UltimateWorkforceEvidence{return {socCodes,tasks:[],skills:[],knowledge:[],technologySkills:[],careerOutcomes:[],sources:[]};}
