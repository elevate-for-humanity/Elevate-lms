import {courseFactory} from '../../lib/course-factory';
async function main() {
 const result=await courseFactory({programSlug:'hospitality',mode:'missing-only',contentSource:'blueprint',videoMode:'queue'},(stage,message,progress)=>console.log(JSON.stringify({stage,message,progress})));
 console.log(JSON.stringify({ok:result.ok,courseId:result.courseId,courseSlug:result.courseSlug,modules:result.moduleCount,lessons:result.lessonCount,videosQueued:result.videosQueued,completionState:result.completionState,errors:result.errors}));
 if(!result.ok||!result.courseId)throw Error('Hospitality Course Builder did not complete authoring');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
