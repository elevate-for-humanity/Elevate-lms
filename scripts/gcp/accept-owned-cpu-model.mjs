import {pathToFileURL} from 'node:url';
const fail=code=>{throw Error('OWNED_CPU_MODEL_'+code);};

/** A real-model test, separate from readiness and from production activation. */
export async function acceptOwnedCpuModel({base,token,invokerToken,loopback=false,request=fetch}={}) {
 let origin;try{origin=new URL(base);}catch{fail('ORIGIN_REQUIRED');}
 const permitted=loopback
  ? origin.protocol==='http:'&&origin.hostname==='127.0.0.1'&&/^\d+$/.test(origin.port)
  : origin.protocol==='https:'&&/^elevate-owned-cpu-llm-[a-z0-9.-]+\.run\.app$/.test(origin.hostname);
 if(!permitted||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)fail('ORIGIN_NOT_AUTHORIZED');
 if(typeof token!=='string'||token.length<24||/\s/.test(token))fail('AUTHENTICATION_REQUIRED');
 const common=invokerToken?{'X-Serverless-Authorization':'Bearer '+invokerToken}:{};
 async function call(path,body,authorized=true) {
  let response;try{response=await request(new URL(path,origin),{method:body?'POST':'GET',redirect:'error',headers:{...common,...(authorized?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(180000)});}catch{fail('REQUEST_FAILED');}
  let payload;try{payload=await response.json();}catch{fail('RESPONSE_INVALID');}
  return {response,payload};
 }
 const denied=await call('/v1/models',undefined,false);
 if(denied.response.status!==401)fail('APPLICATION_AUTH_NOT_ENFORCED');
 const catalog=await call('/v1/models');
 if(!catalog.response.ok||!catalog.payload.data?.some(x=>x.id==='elevate-local'))fail('CATALOG_INVALID');
 const completion=await call('/v1/chat/completions',{model:'elevate-local',messages:[{role:'user',content:'What is 2 plus 2? Answer with the number only.'}],temperature:0,max_tokens:16});
 if(!completion.response.ok||!/^\s*4[.\s]*$/.test(completion.payload.choices?.[0]?.message?.content??''))fail('INFERENCE_FAILED');
 const tool=await call('/v1/chat/completions',{model:'elevate-local',messages:[{role:'user',content:'Use the supplied addition function to add 2 and 2.'}],temperature:0,max_tokens:128,tools:[{type:'function',function:{name:'add_numbers',description:'Add two numbers',parameters:{type:'object',properties:{a:{type:'number'},b:{type:'number'}},required:['a','b'],additionalProperties:false}}}],tool_choice:{type:'function',function:{name:'add_numbers'}}});
 const fn=tool.payload.choices?.[0]?.message?.tool_calls?.[0]?.function;
 let args;try{args=JSON.parse(fn?.arguments??'');}catch{}
 if(!tool.response.ok||fn?.name!=='add_numbers'||args?.a!==2||args?.b!==2)fail('TOOL_CALL_FAILED');
 let stream;try{stream=await request(new URL('/v1/chat/completions',origin),{method:'POST',redirect:'error',headers:{...common,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({model:'elevate-local',messages:[{role:'user',content:'Say hello in one short sentence.'}],temperature:0,max_tokens:32,stream:true}),signal:AbortSignal.timeout(180000)});}catch{fail('STREAM_REQUEST_FAILED');}
 if(!stream.ok||!stream.headers.get('content-type')?.includes('text/event-stream')||!stream.body)fail('STREAM_UNAVAILABLE');
 const reader=stream.body.getReader(),decoder=new TextDecoder();let pending='',done=false,tokens=0;
 try {
  while(!done) {
   const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});
   if(pending.length>1048576)fail('STREAM_OVERSIZED');
   let boundary;
   while((boundary=/\r?\n\r?\n/.exec(pending))) {
    const frame=pending.slice(0,boundary.index);pending=pending.slice(boundary.index+boundary[0].length);
    const data=frame.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');
    if(data==='[DONE]'){done=true;break;}if(!data)continue;
    let event;try{event=JSON.parse(data);}catch{fail('STREAM_INVALID');}
    if(event.error)fail('STREAM_ERROR');
    if(typeof event.choices?.[0]?.delta?.content==='string'&&event.choices[0].delta.content)tokens++;
   }
  }
  if(!done||tokens===0)fail('STREAM_INCOMPLETE');
 } finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
 return {passed:true,model:'elevate-local',applicationAuthentication:true,inference:true,forcedToolCall:true,streaming:true,gpu:false,productionActivated:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 acceptOwnedCpuModel({base:process.env.CPU_MODEL_URL,token:process.env.LLM_WORKER_SECRET,invokerToken:process.env.MODEL_INVOKER_TOKEN,loopback:process.env.CPU_MODEL_LOCAL_TEST==='true'}).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(JSON.stringify({passed:false,error:e.message?.startsWith('OWNED_CPU_MODEL_')?e.message:'OWNED_CPU_MODEL_CHECK_FAILED'}));process.exitCode=1;});
}
