import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyCourseAuditImage} from './audit-course-image.mjs';
const approved='sha256:'+'1'.repeat(64),other='sha256:'+'2'.repeat(64);
const fixture=()=>({image:'us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker@'+approved,approvedDigest:approved,sourceDigest:other,sourceCommit:'a'.repeat(40),job:'elevate-course-builder-parallel'});
test('read-only inspection accepts the explicitly approved immutable image and reports tag drift without claiming source verification',()=>{
 const result=verifyCourseAuditImage(fixture());assert.equal(result.imageMatches,true);assert.equal(result.sourceTagMatchesApprovedImage,false);assert.equal(result.sourceCommitVerified,false);assert.equal(result.executionStarted,false);assert.equal(result.configurationChanged,false);
});
test('a different job digest remains blocked and exposes only safe comparison evidence',()=>{
 const input=fixture();input.image=input.image.replace(approved,other);assert.throws(()=>verifyCourseAuditImage(input),error=>error.message==='COURSE_AUDIT_APPROVED_IMAGE_MISMATCH'&&error.evidence.imageMatches===false);
});
for(const [key,value] of [['image','https://unapproved.invalid/image'],['approvedDigest','latest'],['sourceDigest','invalid'],['sourceCommit','main'],['job','other-job']])test('rejects unverified '+key,()=>assert.throws(()=>verifyCourseAuditImage({...fixture(),[key]:value})));
