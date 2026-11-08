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

it('recovered-source approval fails closed for incomplete or malformed metadata',()=>{
 for(const recovery of [{},{publicationApproved:true},{learnerPublicationApproved:true},
  {publicationApproved:false,learnerPublicationApproved:true},
  {publicationApproved:true,learnerPublicationApproved:null},
  {draftSourceForProductionOnly:false},null,'invalid',[]]) {
  expect(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:recovery})).toBe(false);
 }
 // Ordinary non-recovery lessons remain governed by their existing release contract.
 expect(recoveredSourcePublicationAllowed({})).toBe(true);
});
