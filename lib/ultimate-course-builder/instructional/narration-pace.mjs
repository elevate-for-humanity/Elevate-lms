/** Native speech synthesis feedback; accepted lessons retain their original rate.
 * Limit each correction and the total adjustment to preserve a natural voice.
 * Encoded audio is independently reinspected after synthesis and alignment.
 */
export function narrationRateForRepair(directive, targetWpm = 135) {
 if(directive?.target !== 'natural_narration')return '0%';
 const previous=directive.previous?.narration?.rate??'0%';
 const prior=/^([+-]?\d+(?:\.\d+)?)%$/.exec(previous);
 if(!prior)throw Error('NARRATION_PREVIOUS_RATE_REQUIRED');
 const requirement=directive.requirements?.find(r=>r.code==='PACE_OUT_OF_RANGE');
 if(!requirement)return previous;
 const match=/^Delivered narration failed PACE_OUT_OF_RANGE: (\{.*\})$/.exec(requirement.message??'');
 if(!match)throw Error('NARRATION_PACE_MEASUREMENT_REQUIRED');
 const measured=JSON.parse(match[1]).metrics?.wordsPerMinute;
 if(measured?.measured!==true||!Number.isFinite(measured.value)||measured.value<=0||
    !Number.isFinite(targetWpm)||targetWpm<115||targetWpm>150)
  throw Error('NARRATION_PACE_MEASUREMENT_REQUIRED');
 const speed=1+Number(prior[1])/100;
 const correction=Math.max(.85,Math.min(1.15,targetWpm/measured.value));
 const next=Math.max(.8,Math.min(1.2,speed*correction));
 const percent=Math.round((next-1)*100);
 if(percent===Math.round((speed-1)*100))throw Error('NARRATION_NATIVE_PACE_REPAIR_LIMIT');
 return (percent>0?'+':'')+percent+'%';
}
