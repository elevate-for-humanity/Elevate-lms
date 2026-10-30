/** Two image preparations at a time; settle both before surfacing a failure. */
export class TeachingPhotoBatch {
 pending=[];
 async add(work){
  this.pending.push(Promise.resolve().then(work).then(()=>null,error=>({error})));
  if(this.pending.length===2)await this.flush();
 }
 async flush(){
  const outcomes=await Promise.all(this.pending.splice(0));
  const failed=outcomes.find(outcome=>outcome!==null);
  if(failed)throw failed.error;
 }
}
