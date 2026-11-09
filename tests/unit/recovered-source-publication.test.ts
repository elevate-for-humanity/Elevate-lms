import {expect,it} from 'vitest';
import {prepareUltimatePublication} from '@/lib/ultimate-course-builder/release/prepare-publication';
import {recoveredSourcePublicationAllowed} from '@/lib/ultimate-course-builder/release/recovered-source-policy.mjs';
it('recovered draft publication requires source and learner approvals before release validation',()=>{
 const recovery={draftSourceForProductionOnly:true,publicationApproved:false,learnerPublicationApproved:false};
 const profile={existingLessonSourceRecovery:recovery};
 expect(()=>prepareUltimatePublication({profile},'actor')).toThrow('ULTIMATE_SOURCE_PUBLICATION_APPROVAL_REQUIRED');
 for(const entry of [{},{publicationApproved:true},{learnerPublicationApproved:true},null,[],false,'invalid',recovery])
  expect(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:entry})).toBe(false);
 const approved={existingLessonSourceRecovery:{...recovery,publicationApproved:true,learnerPublicationApproved:true}};
 expect(recoveredSourcePublicationAllowed(approved)).toBe(true);
 expect(()=>prepareUltimatePublication({profile:approved},'actor')).toThrow('ULTIMATE_RELEASE_CONTRACT_REQUIRED');
 expect(recoveredSourcePublicationAllowed({})).toBe(true);
});
