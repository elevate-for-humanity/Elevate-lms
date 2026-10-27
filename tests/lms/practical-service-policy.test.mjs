import test from 'node:test';
import assert from 'node:assert/strict';
import {canOwnerRecordService,validPracticalServiceDate} from '../../lib/apprenticeship/practical-service-policy.mjs';
const shop={active:true,owner_id:'owner',partner_id:'partner'};
test('only owning shop identity can check off; student cannot self-verify',()=>{
 const check=(userId,role='owner',partner_id='partner')=>canOwnerRecordService({userId,studentId:'student',shop,members:[{role,partner_id,status:'active'}]});
 assert.equal(check('owner'),true);
 assert.equal(check('partner-owner'),true);
 assert.equal(check('student'),false);
 for(const role of ['supervisor','mentor','manager','admin','partner_admin']) assert.equal(check('other',role),false);
 assert.equal(check('other','owner','other-partner'),false);
 assert.equal(canOwnerRecordService({userId:'owner',studentId:'student',shop:{...shop,active:false},members:[]}),false);
});
test('valid real service dates pass; future and impossible dates fail',()=>{
 assert.equal(validPracticalServiceDate('2026-10-27','2026-10-27'),true);
 assert.equal(validPracticalServiceDate('2026-10-26','2026-10-27'),true);
 assert.equal(validPracticalServiceDate('2026-10-28','2026-10-27'),false);
 assert.equal(validPracticalServiceDate('2026-02-30','2026-10-27'),false);
 assert.equal(validPracticalServiceDate('2026-13-01','2026-10-27'),false);
});
