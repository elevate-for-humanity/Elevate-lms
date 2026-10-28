import test from 'node:test';
import assert from 'node:assert/strict';
import {ASSETS,SECTIONS,validateAsset,validateSections} from './repair-preserved-cosmetology-motion.mjs';
function fixture(a){return [{id:a.id,course_id:'a6b0b712-1cf0-475a-ba79-ee2023dea8ec',storage_path:a.path,entitlement_id:a.entitlementId,asset_role:'source_broll'},{id:a.entitlementId,provider:'envato',metadata:{visual_observation:{contentSha256:a.sha256,visibleActions:['observed source action']},license_certificate_sha256:a.certificateSha256,license_evidence_url:a.licenseUrl,license_certificate_verification:'matched_item_id_license_code_project_and_licensee'}}];}
test('only exact reviewed course source and independently registered entitlement pass',()=>{
 for(const a of ASSETS){const [row,e]=fixture(a);assert.equal(validateAsset(row,a,e),true);
 for(const change of [{storage_path:'other.mp4'},{course_id:'other'},{entitlement_id:'other'},{asset_role:'generated'}])assert.throws(()=>validateAsset({...row,...change},a,e));
 for(const key of ['license_certificate_sha256','license_evidence_url','license_certificate_verification'])assert.throws(()=>validateAsset(row,a,{...e,metadata:{...e.metadata,[key]:null}}));
 assert.throws(()=>validateAsset(row,a,{...e,metadata:{...e.metadata,visual_observation:{contentSha256:'0'.repeat(64),visibleActions:['wrong bytes']}}}));
 }
});
test('all original scenes cover original duration without gaps, overlaps or new assets',()=>{
 assert.equal(validateSections(SECTIONS,292.048665),true);
 for(const changes of [{start:1},{end:0},{asset:99},{start:NaN}])assert.throws(()=>validateSections([{...SECTIONS[0],...changes},...SECTIONS.slice(1)],292.048665));
 assert.throws(()=>validateSections(SECTIONS.slice(0,-1),292.048665));
});
