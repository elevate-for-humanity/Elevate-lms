import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=stripTypeScriptTypes(readFileSync(new URL('../apps/admin/app/api/admin/dev-studio/workflows/route.ts',import.meta.url),'utf8'))
 .replace(/^import .*;\n/gm,'').replace(/^export /gm,'');

test('workflow inspection returns task identities and statuses without recursively copying prior tool evidence',async()=>{
 const previous={id:'previous',title:'Inspect workflows',status:'completed',tool_name:'workflows.inspect',tool_output:{workflows:[{tool_output:'x'.repeat(1_000_000)}]},result_json:{nested:'prior evidence'},payload:{private:'input'}};
 let projection;
 const db={from(table){assert.equal(table,'ai_tasks');return {select(fields){projection=fields;return this;},order(){return this;},async limit(){return {data:[Object.fromEntries(Object.entries(previous).filter(([key])=>projection==='*'||projection.split(',').includes(key)))],error:null};}};}};
 const factory=new Function('apiRequireDevStudio','applyRateLimit','requireAdminClient','buildCommandCenterSnapshot','jsonOk','safeInternalError','fetch',source+'\nreturn GET;');
 const GET=factory(async()=>({id:'admin'}),async()=>null,async()=>db,async()=>({activeTasks:0}),body=>Response.json(body),()=>Response.json({error:'failed'},{status:500}),async()=>Response.json({healthy:true}));
 const response=await GET({nextUrl:new URL('https://admin.example.test/api/admin/dev-studio/workflows'),url:'https://admin.example.test/api/admin/dev-studio/workflows',headers:new Headers()});
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.workflows[0].id,'previous');
 assert.equal(body.workflows[0].status,'completed');
 assert.equal(body.workflows[0].tool_name,'workflows.inspect');
 for(const field of ['tool_output','result','result_json','payload','plan','plan_json'])assert.equal(field in body.workflows[0],false);
 assert.ok(JSON.stringify(body).length<2048);
 assert.equal(previous.tool_output.workflows[0].tool_output.length,1_000_000);
});
