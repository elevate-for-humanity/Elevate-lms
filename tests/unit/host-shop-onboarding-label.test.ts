import {expect,it} from 'vitest';
import {hostShopOnboardingLabel} from '@/lib/partners/host-shop-onboarding-label';
it('accepted documents never display an old documents step as missing documents',()=>{
 const partner={onboarding_step:'documents',onboarding_completed:false,mou_signed:false};
 expect(hostShopOnboardingLabel(partner,5,0)).toBe('Incomplete — MOU signature');
 expect(hostShopOnboardingLabel({...partner,mou_signed:true},5,0)).toBe('Incomplete — onboarding confirmation');
 expect(partner.onboarding_completed).toBe(false);
});
it('keeps genuine document gaps and missing requirements visible',()=>{
 expect(hostShopOnboardingLabel({},5,2)).toBe('Incomplete — documents need review');
 expect(hostShopOnboardingLabel({},0,0)).toContain('requirements not configured');
});
it('does not revoke completed onboarding because a document later needs renewal',()=>{
 expect(hostShopOnboardingLabel({onboarding_completed:true},5,1)).toBe('Complete');
});
