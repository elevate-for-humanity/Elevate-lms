/**
 * Native timeupdate events are frequent, but whole percentages may take many
 * seconds on instructional films. Permit a 3-second server-progress callback
 * even when the rounded percentage hasn't advanced. Never infer watched
 * seconds here; that belongs to the authenticated server.
 */
export function playbackProgressSignal({timeSeconds,percent,lastPercent,lastBucket}) {
  if(!Number.isFinite(timeSeconds)||timeSeconds<0||
     !Number.isInteger(percent)||percent<0||percent>100)
    return {notify:false,percentChanged:false,bucket:lastBucket};
  const bucket=Math.floor(timeSeconds/3);
  const percentChanged=percent!==lastPercent;
  return {notify:percentChanged||bucket!==lastBucket,percentChanged,bucket};
}
