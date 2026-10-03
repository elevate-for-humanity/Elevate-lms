import {describe,it,expect} from 'vitest';
import {requestMediaDependency} from '@/lib/ultimate-course-builder/worker/request-media-dependency';

function database(owner: string|null='creator') {
  const runs:Record<string,unknown>[]=[];
  const api={from(table:string){
    let row:Record<string,unknown>|undefined;
    const query={select(){return query;},eq(){return query;},
      async single(){return {data:table==='courses'?{created_by:owner,title:'Cosmetology'}:runs[0],error:null};},
      async upsert(input:Record<string,unknown>,options:Record<string,unknown>){
        expect(options).toEqual({onConflict:'user_id,idempotency_key',ignoreDuplicates:true});
        if(!runs.length)runs.push({id:'run-id',...input});
        return {error:null};
      },update(input:Record<string,unknown>){row=input;return {async eq(){Object.assign(runs[0],row);return {error:null};}};}
    };
    return query;
  }};
  return {db:api,runs};
}
const input={courseId:'course',competencyId:'lesson',lessonTitle:'Welcome',
  gaps:[{sceneId:'scene:record',visualRequirement:'Show the date, activity and reviewer.',reason:'No suitable footage'}]};

describe('existing Studio media request',()=>{
  it('reuses the owner-scoped request and preserves exact scene requirements',async()=>{
    const {db,runs}=database();
    const first=await requestMediaDependency(db as never,input);
    const second=await requestMediaDependency(db as never,{...input,gaps:[...input.gaps,
      {sceneId:'scene:feedback',visualRequirement:'Show correction of the observed activity.',reason:'Missing'}]});
    expect(first?.runId).toBe(second?.runId);
    expect(runs).toHaveLength(1);
    expect(runs[0].user_id).toBe('creator');
    expect(runs[0].status).toBe('planning');
    expect(second?.gapCount).toBe(2);
    expect(runs[0].command).toContain(input.gaps[0].visualRequirement);
    expect(runs[0].command).toContain('Do not purchase');
  });
  it('does not create a browser request for a fully covered lesson',async()=>{
    const {db,runs}=database();
    expect(await requestMediaDependency(db as never,{...input,gaps:[]})).toBeNull();
    expect(runs).toHaveLength(0);
  });
  it('does not create unowned provider sessions',async()=>{
    const {db,runs}=database(null);
    await expect(requestMediaDependency(db as never,input)).rejects.toThrow('ULTIMATE_MEDIA_OWNER_REQUIRED');
    expect(runs).toHaveLength(0);
  });
});
