import type {TeachingVisualRequirement,UltimateMediaCandidate} from './media-director';
export interface UltimateLicensedLibrary{search(requirement:TeachingVisualRequirement):Promise<UltimateMediaCandidate[]>;store(input:{bytes:Uint8Array;mimeType:string;licenseEvidence:Record<string,unknown>;candidate:UltimateMediaCandidate}):Promise<UltimateMediaCandidate>}
