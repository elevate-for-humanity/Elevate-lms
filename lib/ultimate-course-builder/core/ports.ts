export interface UltimatePersistencePort{createBuild(input:unknown):Promise<{id:string}>;recordStep(input:unknown):Promise<void>;saveArtifact(input:unknown):Promise<void>;recordFinding(input:unknown):Promise<void>}
export interface UltimateWorkforcePort{load(input:{socCodes:string[];jurisdiction?:string}):Promise<unknown>}
export interface UltimateCredentialPort{load(profileId:string):Promise<unknown>}
export interface UltimateMediaPort{find(input:unknown):Promise<unknown[]>;acquire(input:unknown):Promise<unknown>;store(input:unknown):Promise<unknown>}
export interface UltimateNarrationPort{generate(input:unknown):Promise<unknown>}
export interface UltimateRenderPort{render(input:unknown):Promise<unknown>}
export interface UltimateAssessmentPort{generate(input:unknown):Promise<unknown>}
