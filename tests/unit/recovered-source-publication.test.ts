import {expect,it} from 'vitest';
import {prepareUltimatePublication} from '@/lib/ultimate-course-builder/release/prepare-publication';
import {recoveredSourcePublicationAllowed} from '@/lib/ultimate-course-builder/release/recovered-source-policy.mjs';
it('draft restoration cannot publish through an externally supplied release package',()=>{
 const recovery={draftSourceForProductionOnly:true,publicationApproved:false,learnerPublicationApproved:false};
 const profile={existingLessonSourceRecovery:recovery};
 expect(recoveredSourcePublicationAllowed(profile)).toBe(false);
 expect(()=>prepareUltimatePublication({profile},'actor')).toThrow('ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED');
 expect(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:{...recovery,publicationApproved:true}})).toBe(false);
 expect(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:{...recovery,publicationApproved:true,learnerPublicationApproved:true}})).toBe(true);
 expect(recoveredSourcePublicationAllowed({})).toBe(true);
});
