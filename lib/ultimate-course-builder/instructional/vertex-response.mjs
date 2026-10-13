export function parseVertexLessonResponse(output) {
 const candidate=output?.candidates?.[0];
 if(candidate?.finishReason!=='STOP') throw Error('ULTIMATE_GOOGLE_AUTHORING_INCOMPLETE');
 let text=(candidate.content?.parts??[]).filter(p=>p.thought!==true&&typeof p.text==='string').map(p=>p.text).join('').trim();
 if(text.startsWith('```')) text=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let value;
 try {value=JSON.parse(text);}catch {throw Error('ULTIMATE_GOOGLE_AUTHORING_JSON_INVALID');}
 if(!value||typeof value!=='object'||Array.isArray(value)) throw Error('ULTIMATE_GOOGLE_AUTHORING_JSON_INVALID');
 return value;
}
