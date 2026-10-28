import { expect, it } from 'vitest';
import { loadHolderExitReports } from '@/lib/program-holder/exit-reports';
it('loads every exit report with holder scope and deterministic pagination', async () => {
 const ranges: number[]=[];const filters:any[]=[];
 const db={from(table:string){expect(table).toBe('program_holder_reports');const q:any={select:()=>q,eq:(key:string,value:string)=>{filters.push([key,value]);return q;},contains:()=>q,order:()=>q,range:async(from:number)=>{ranges.push(from);return {data:Array.from({length:from===0?500:1},(_,i)=>({id:from+i})),error:null};}};return q;}};
 expect(await loadHolderExitReports(db,'holder')).toHaveLength(501);
 expect(ranges).toEqual([0,500]);expect(filters.filter(([key])=>key==='program_holder_id')).toEqual([['program_holder_id','holder'],['program_holder_id','holder']]);
});
it('does not turn a failed history page into an empty register', async () => {
 const q:any={select:()=>q,eq:()=>q,contains:()=>q,order:()=>q,range:async()=>({data:null,error:{message:'unavailable'}})};
 await expect(loadHolderExitReports({from:()=>q},'holder')).rejects.toThrow('Exit reports could not be loaded.');
});
