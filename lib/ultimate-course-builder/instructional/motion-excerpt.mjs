import {compatibleVisualTask} from './reviewed-scene-evidence.ts';
export function motionExcerptWindow(pictures,evidence,sourceSeconds,primaryEnd){
 if(!(sourceSeconds>0)||!evidence?.contentSha256||!Array.isArray(evidence.visibleActions))throw Error('INSPECTED_MOTION_SOURCE_REQUIRED');
 for(const picture of pictures){
  if(picture.startSeconds>=primaryEnd)continue;
  const observed=evidence.visibleActions.find(action=>compatibleVisualTask(picture.narrationQuote,action));
  if(!observed)continue;
  const next=pictures.find(p=>p.startSeconds>picture.startSeconds&&p.narrationQuote!==picture.narrationQuote);
  const end=Math.min(primaryEnd,next?.startSeconds??primaryEnd,picture.startSeconds+sourceSeconds);
  if(end-picture.startSeconds<Math.min(2,sourceSeconds))continue;
  return {startSeconds:picture.startSeconds,endSeconds:end,observedAction:observed,contentSha256:evidence.contentSha256};
 }
 throw Error('SPOKEN_ACTION_MOTION_FOOTAGE_NOT_AVAILABLE');
}
