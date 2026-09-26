import {aiChat} from '@/lib/ai/ai-service';
type ChatInput={system:string;input:unknown;temperature?:number;maxTokens?:number};
export async function ultimateWorkerJson(input:ChatInput){
 const result=await aiChat({provider:'cloudflare',messages:[{role:'system',content:input.system+' Return valid JSON only.'},{role:'user',content:JSON.stringify(input.input)}],temperature:input.temperature??.25,maxTokens:input.maxTokens??7000});
 const content=String(result.content??'').replace(/\`\`\`json?/g,'').replace(/\`\`\`/g,'').trim();
 if(!content)throw new Error('ULTIMATE_AI_EMPTY');
 try{return JSON.parse(content);}catch{throw new Error('ULTIMATE_AI_INVALID_JSON');}
}
