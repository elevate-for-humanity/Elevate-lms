import type {UltimateCredentialProfile} from '../core/types';
export interface UltimateCredentialRepository{getProfile(id:string):Promise<UltimateCredentialProfile|null>}
export class UltimateCredentialProvider{constructor(private repo:UltimateCredentialRepository){}async load(id:string){const profile=await this.repo.getProfile(id);if(!profile)throw new Error('ULTIMATE_CREDENTIAL_PROFILE_NOT_FOUND:'+id);return profile;}}
