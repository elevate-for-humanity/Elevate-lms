/** Approval belongs to the exact published lesson/file, never its newer draft. */
export async function ownerApprovedPreview(db,build,lesson){
 const profile=build?.profile,ref=profile?.presentationContract?.approvedReferenceVideo;
 const id=profile?.canonicalLessonIds?.[lesson?.competency_id];
 if(!id||!ref?.storagePath||!/^[a-f0-9]{64}$/.test(ref.sha256??''))return null;
 const {data:published,error}=await db.from('course_lessons')
  .select('id,course_id,approved,is_published,video_url,media_quality_status,media_quality_evidence')
  .eq('id',id).eq('course_id',build.course_id).maybeSingle();
 if(error)throw error;
 const evidence=published?.media_quality_evidence;
 if(!published?.approved||!published.is_published||published.media_quality_status!=='approved'||
  evidence?.reviewMode!=='explicit-owner-approval'||!evidence.reviewerId||
  evidence.sourceLessonBuildId!==lesson.id||evidence.mediaSha256!==ref.sha256||
  !Number.isInteger(evidence.sourceArtifactVersion)||evidence.sourceArtifactVersion<1)return null;
 let url;try{url=new URL(published.video_url);}catch{return null;}
 if(url.origin!=='https://cuxzzpsyufcewtmicszk.supabase.co'||url.search||url.hash||
  url.pathname!=='/storage/v1/object/public/course-videos/'+ref.storagePath||
  !ref.storagePath.startsWith('generated-lessons/lesson-'+id+'-'))return null;
 return {videoUrl:published.video_url,version:evidence.sourceArtifactVersion,
  durationSeconds:evidence.decodedDurationSeconds,sha256:evidence.mediaSha256,
  automatedAcceptanceComplete:evidence.automatedAcceptanceComplete===true};
}
