import { expect, it } from 'vitest';
import { missingHostShopRegisteredStandards } from '@/lib/partners/host-shop-orientation-readiness';
it('does not certify an unconfigured cosmetology occupation through another hosted standard', () => {
 expect(missingHostShopRegisteredStandards({registeredPrograms:[{programSlug:'barber-apprenticeship'},{programSlug:'cosmetology-apprenticeship'}],tradeInfo:{registered:true,programSlug:'barber-apprenticeship'}})).toEqual(['cosmetology-apprenticeship']);
});
it('retains the existing configured registered occupation and checks the primary fallback', () => {
 expect(missingHostShopRegisteredStandards({registeredPrograms:[{programSlug:'barber-apprenticeship'}],tradeInfo:{registered:true,programSlug:'barber-apprenticeship'}})).toEqual([]);
 expect(missingHostShopRegisteredStandards({registeredPrograms:[],tradeInfo:{registered:true,programSlug:'cosmetology-apprenticeship'}})).toEqual(['cosmetology-apprenticeship']);
});
