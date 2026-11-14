import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';

/** Native ONNX/phonemizer initialization can block for seconds. Keep it off
 * the queue/HTTP event loop while reusing the same approved model and voice. */
export function createIsolatedKokoroModel({workerFactory=()=>new Worker(new URL(import.meta.url),{
 workerData:{kokoroNarration:true},execArgv:[],
}),timeoutMs=120000}={}){
 let worker,sequence=0;
 const pending=new Map();
 const stop=(current,error)=>{
  if(worker===current)worker=undefined;
  for(const [id,call]of pending){if(call.worker!==current)continue;
   clearTimeout(call.timer);pending.delete(id);call.reject(error);
  }
 };
 const acquire=()=>{
  if(worker)return worker;
  const current=workerFactory();worker=current;
  current.on('message',message=>{
   const call=pending.get(message?.id);if(!call||call.worker!==current)return;
   clearTimeout(call.timer);pending.delete(message.id);
   if(![...pending.values()].some(value=>value.worker===current))current.unref();
   if(message.error)call.reject(new Error(message.error));else call.resolve(message.audio);
  });
  current.on('error',error=>{stop(current,error);void current.terminate();});
  current.on('exit',code=>stop(current,new Error('KOKORO_INFERENCE_WORKER_EXIT:'+code)));
  current.unref();return current;
 };
 return {generate(text,options){
  const current=acquire(),id=++sequence;
  return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{
    stop(current,new Error('KOKORO_INFERENCE_WORKER_TIMEOUT'));void current.terminate();
   },timeoutMs);
   pending.set(id,{resolve,reject,timer,worker:current});current.ref();
   try{current.postMessage({id,text,options});}
   catch(error){stop(current,error);void current.terminate();}
  });
 }};
}

if(!isMainThread&&workerData?.kokoroNarration===true){
 let modelPromise,tail=Promise.resolve();
 const model=()=>modelPromise??=(async()=>{
  const {KokoroTTS}=await import('kokoro-js');
  // Same preloaded production model, quantization and native CPU provider.
  // The image preloads Kokoro at build time. Never download model files
  // while rendering lessons: remote 429s must not fail production jobs.
  // Offline availability is enforced by the preloaded model image and
  // runtime network policy, not by an unsupported KokoroJS option.
  // No commercial fallback, source changes or replacement narration.
  return KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'cpu'});
 })().catch(error=>{modelPromise=undefined;throw error;});
 parentPort.on('message',message=>{
  // A shared native model processes one request at a time.
  tail=tail.then(async()=>{
   try{
    const narrator=await model();const audio=await narrator.generate(message.text,message.options);
    const samples=audio.audio??audio.data;
    parentPort.postMessage({id:message.id,audio:{sampling_rate:audio.sampling_rate,audio:samples}});
   }catch(error){parentPort.postMessage({id:message.id,error:error instanceof Error?error.message:String(error)});}
  });
 });
}
