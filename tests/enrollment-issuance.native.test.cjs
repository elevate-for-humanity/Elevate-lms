const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { stripTypeScriptTypes } = require('node:module');
const root = __dirname + '/../lib/certificates/';
function source(name) { return stripTypeScriptTypes(readFileSync(root + name, 'utf8')).replace(/^import .*;\n/gm, '').replace(/export /g, ''); }
const policy = new Function(source('enrollment-issuance-policy.ts') + ';return {eligibleForEnrollmentCertificate,enrollmentCertificateCampaign}')();
const service = new Function('eligibleForEnrollmentCertificate', 'enrollmentCertificateCampaign', 'hostStudentCertificatePdf', source('enrollment-issuance.ts') + ';return {queuePaidEnrollmentCertificates,enrollmentCertificateAttachments}')(
  policy.eligibleForEnrollmentCertificate, policy.enrollmentCertificateCampaign, async () => Buffer.from('%PDF-test'),
);
const id = '00000000-0000-4000-8000-000000000001';
const enrollment = { id, user_id: 'student', student_id: 'student', program_slug: 'barber-apprenticeship', status: 'active', payment_status: 'paid', amount_paid_cents: 60000, amount_paid: 0, revoked_at: null, refunded_at: null, enrolled_at: '2026-09-01', host_shop_id: 'shop' };
function database(overrides = {}) {
  const tables = {program_enrollments: [{...enrollment}], profiles: [{id:'student', full_name:'Alex Student',email:'student@example.test'}], apprentice_placements: [{id:'placement',student_id:'student',program_slug:'barber-apprenticeship',shop_id:'shop',status:'active',end_date:null}], host_shops:[{id:'shop',name:'Assigned Shop',owner_email:'owner@example.test'}], programs:[{slug:'barber-apprenticeship',name:'Barber Apprenticeship',duration_hours:2000}], communication_email_mailboxes:[{id:'mailbox',address:'admissions@elevateforhumanity.org',active:true}], communication_email_outbox:[], ...overrides};
  return {tables, from(table) {
    let rows = [...(tables[table] || [])];
    let pendingUpdate = null;
    // tables.review_trigger_partners simulates the production outbox review
    // trigger (private.review_paris_outbox): a 'pending' insert addressed to a
    // partner contact is silently diverted and never lands in the outbox.
    const q = { select(){return q}, eq(k,v){rows=rows.filter(r=>r[k]===v);return q}, is(k,v){rows=rows.filter(r=>r[k]===v);return q}, order(){return q}, range(a,b){rows=rows.slice(a,b+1);return q}, maybeSingle(){return Promise.resolve({data:rows[0]||null,error:null})}, update(values){pendingUpdate=values;return q}, upsert(input){for(const row of input){if((row.status||'pending')==='pending'&&(tables.review_trigger_partners||[]).includes(row.recipient_email))continue;if(!tables[table].some(r=>r.campaign_key===row.campaign_key&&r.recipient_email===row.recipient_email))tables[table].push({...row})}return Promise.resolve({error:null})}, then(resolve,reject){if(pendingUpdate)for(const row of rows)Object.assign(row,pendingUpdate);return Promise.resolve({data:rows,error:null}).then(resolve,reject)} };return q;
  }};
}
test('deposit qualifies without full tuition payment',()=>assert.equal(policy.eligibleForEnrollmentCertificate(enrollment),true));
for(const payment_status of ['pending','failed','refunded','void','qa_test']) test(payment_status+' cannot issue',()=>assert.equal(policy.eligibleForEnrollmentCertificate({...enrollment,payment_status}),false));
test('pending enrollment cannot become enrollment credential from payment alone',()=>assert.equal(policy.eligibleForEnrollmentCertificate({...enrollment,status:'pending'}),false));
test('revocation or refund blocks issuance',()=>{for(const field of ['revoked_at','refunded_at'])assert.equal(policy.eligibleForEnrollmentCertificate({...enrollment,[field]:'2026-11-01'}),false)});
test('unpaid enrollment is not auto-issued',()=>assert.equal(policy.eligibleForEnrollmentCertificate({...enrollment,payment_status:null,amount_paid_cents:0}),false));
test('queue is idempotent and sends only to student and current shop',async()=>{const db=database();assert.deepEqual(await service.queuePaidEnrollmentCertificates(db),{queued:2});assert.deepEqual(await service.queuePaidEnrollmentCertificates(db),{queued:0});assert.deepEqual(db.tables.communication_email_outbox.map(r=>r.recipient_email).sort(),['owner@example.test','student@example.test'])});
test('another shop cannot receive the PDF',async()=>{await assert.rejects(service.enrollmentCertificateAttachments(database(),policy.enrollmentCertificateCampaign(id),'foreign@example.test'),/recipient/)});
test('host shop copy survives the partner-review outbox trigger',async()=>{const db=database({review_trigger_partners:['owner@example.test']});assert.deepEqual(await service.queuePaidEnrollmentCertificates(db),{queued:2});const rows=db.tables.communication_email_outbox;assert.deepEqual(rows.map(r=>r.recipient_email).sort(),['owner@example.test','student@example.test']);assert.deepEqual(rows.map(r=>r.status||'pending').sort(),['pending','pending']);assert.deepEqual(await service.queuePaidEnrollmentCertificates(db),{queued:0});assert.equal(db.tables.communication_email_outbox.length,2)});
test('a stranded staged host copy is released on the next run',async()=>{const db=database({review_trigger_partners:['owner@example.test']});db.tables.communication_email_outbox.push({campaign_key:policy.enrollmentCertificateCampaign(id),user_id:'student',recipient_email:'owner@example.test',mailbox_id:'mailbox',subject:'s',body:'b',status:'processing'});db.tables.communication_email_outbox.push({campaign_key:policy.enrollmentCertificateCampaign(id),user_id:'student',recipient_email:'student@example.test',mailbox_id:'mailbox',subject:'s',body:'b',status:'sent'});assert.deepEqual(await service.queuePaidEnrollmentCertificates(db),{queued:0});assert.equal(db.tables.communication_email_outbox.find(r=>r.recipient_email==='owner@example.test').status,'pending')});
test('refund after queue blocks sending',async()=>{const db=database();db.tables.program_enrollments[0].refunded_at='2026-11-01';await assert.rejects(service.enrollmentCertificateAttachments(db,policy.enrollmentCertificateCampaign(id),'owner@example.test'),/payment/)});
test('current valid recipient receives attached PDF',async()=>{const [a]=await service.enrollmentCertificateAttachments(database(),policy.enrollmentCertificateCampaign(id),'owner@example.test');assert.equal(a.type,'application/pdf');assert.match(a.filename,/EFH-HS-PLACEMENT-v2.pdf/);assert.equal(Buffer.from(a.content,'base64').toString(),'%PDF-test')});
test('unrelated campaigns have no certificate attachment',async()=>assert.equal(await service.enrollmentCertificateAttachments(database(),'interview-followup','owner@example.test'),undefined));
test('conflicting host assignments fail closed',async()=>{const db=database();db.tables.apprentice_placements.push({...db.tables.apprentice_placements[0],id:'other',shop_id:'foreign'});await assert.rejects(service.queuePaidEnrollmentCertificates(db),/Conflicting/)});

const completion = new Function('hostStudentCertificatePdf', source('program-completion-pdf.ts') + ';return {validateCompletionDocument,programCompletionPdf}')(async record => record);
const finished = {certificateNumber:'EFH-COMPLETE-1',studentName:'Alex Student',studentId:'student',courseTitle:'HVAC Technician Training',startDate:'2026-01-01',completionDate:'2026-02-01'};
test('completion certificate includes course, credential and both actual dates',async()=>{const record=await completion.programCompletionPdf(finished);assert.equal(record.title,'Certificate of Completion');assert.equal(record.program,finished.courseTitle);assert.equal(record.shopName,'Elevate Certificate of Completion');assert.deepEqual(record.completion,{startDate:finished.startDate,completionDate:finished.completionDate})});
for(const [name,change] of Object.entries({missing_start:{startDate:''},invalid_date:{completionDate:'2026-02-30'},future_completion:{completionDate:'2099-01-01'},reversed_dates:{startDate:'2026-03-01'},missing_course:{courseTitle:''}})) test('completion rejects '+name,()=>assert.throws(()=>completion.validateCompletionDocument({...finished,...change})));
