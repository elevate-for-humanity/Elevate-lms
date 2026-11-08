import {expect,it} from 'vitest';
import {prepareUltimatePublication} from '@/lib/ultimate-course-builder/release/prepare-publication';
import {recoveredSourcePublicationAllowed} from '@/lib/ultimate-course-builder/release/recovered-source-policy.mjs';

// The publication-approval restriction was removed: a recovered draft source no
// longer blocks publication. The canonical release checks (lesson contract,
// media render, quality role) remain the real gate and still throw.
it('recovered draft sources are publishable once the release contract passes',()=>{
 const recovery={draftSourceForProductionOnly:true,publicationApproved:false,learnerPublicationApproved:false};
 const profile={existingLessonSourceRecovery:recovery};
 expect(recoveredSourcePublicationAllowed(profile)).toBe(true);
 expect(recoveredSourcePublicationAllowed({})).toBe(true);
 expect(recoveredSourcePublicationAllowed({existingLessonSourceRecovery:{...recovery,publicationApproved:true}})).toBe(true);
});

it('the release contract is still enforced independently of source provenance',()=>{
 const profile={existingLessonSourceRecovery:{draftSourceForProductionOnly:true,publicationApproved:false,learnerPublicationApproved:false}};
 // No lessons / wrong contract version still throws: publication is not a rubber stamp.
 expect(()=>prepareUltimatePublication({profile},'actor')).toThrow('ULTIMATE_RELEASE_CONTRACT_REQUIRED');
});

