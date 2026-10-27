export interface UltimateNarrationRequest{lessonId:string;script:string;voiceProfile:{tone:'neutral-calm';targetWpm:number;voiceId?:string}}
export interface UltimateNarrationResult{audioUrl:string;durationSeconds:number;transcript:string;captions:Array<{start:number;end:number;text:string}>;provider:string}
export interface UltimateNarrationProvider{generate(input:UltimateNarrationRequest):Promise<UltimateNarrationResult>}
export class UltimateNarrationService{constructor(private provider:UltimateNarrationProvider){}generate(input:UltimateNarrationRequest){return this.provider.generate(input);}}
