import {pathToFileURL} from 'node:url';
const registry='us-central1-docker.pkg.dev/elegant-racer-299721/elevate/ultimate-worker';
const digest=value=>/^sha256:[a-f0-9]{64}$/.test(value||'');
// A mutable source tag is diagnostic context, not the approval authority.
// This verifies only an existing image for read-only storage inspection.
export function verifyCourseAuditImage({image,approvedDigest,sourceDigest,sourceCommit,job}={}){
 if(!digest(approvedDigest)||!digest(sourceDigest)||!/^[a-f0-9]{40}$/.test(sourceCommit||'')||!['elevate-course-builder','elevate-course-builder-overflow','elevate-course-builder-parallel','elevate-course-builder-repair'].includes(job))throw Error('COURSE_AUDIT_APPROVAL_INVALID');
 if(!image?.startsWith(registry+'@')||!digest(image.slice(registry.length+1)))throw Error('COURSE_AUDIT_IMAGE_REFERENCE_UNVERIFIED');
 const evidence={job,approvedSource:sourceCommit,approvedDigest,observedDigest:image.split('@')[1],sourceTagDigest:sourceDigest,imageMatches:image===registry+'@'+approvedDigest,sourceTagMatchesApprovedImage:sourceDigest===approvedDigest,sourceCommitVerified:false,executionStarted:false,configurationChanged:false};
 if(!evidence.imageMatches){const error=Error('COURSE_AUDIT_APPROVED_IMAGE_MISMATCH');error.evidence=evidence;throw error;}
 return evidence;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(JSON.stringify(verifyCourseAuditImage({image:process.env.OBSERVED_IMAGE,approvedDigest:process.env.APPROVED_DIGEST,sourceDigest:process.env.SOURCE_DIGEST,sourceCommit:process.env.APPROVED_SOURCE,job:process.env.JOB})));}
 catch(error){if(error.evidence)console.log(JSON.stringify(error.evidence));console.error(/^COURSE_AUDIT_[A-Z_]+$/.test(error.message)?error.message:'COURSE_AUDIT_IMAGE_CHECK_FAILED');process.exitCode=1;}
}
