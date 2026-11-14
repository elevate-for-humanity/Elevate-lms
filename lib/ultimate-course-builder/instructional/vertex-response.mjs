export function parseVertexLessonResponse(output) {
 const candidate=output?.candidates?.[0];
 if(candidate?.finishReason!=='STOP') {
  const known=new Set(['MAX_TOKENS','SAFETY','RECITATION','OTHER','FINISH_REASON_UNSPECIFIED','BLOCKLIST','PROHIBITED_CONTENT','SPII','MALFORMED_FUNCTION_CALL','UNEXPECTED_TOOL_CALL','NO_IMAGE','IMAGE_SAFETY','IMAGE_PROHIBITED_CONTENT','IMAGE_RECITATION','IMAGE_OTHER','MODEL_ARMOR']);
  const reason=known.has(candidate?.finishReason)?candidate.finishReason:'UNKNOWN';
  const error=new Error('ULTIMATE_GOOGLE_AUTHORING_INCOMPLETE:'+reason);
  error.code='ULTIMATE_GOOGLE_AUTHORING_INCOMPLETE';error.finishReason=reason;throw error;
 }
 let text=(candidate.content?.parts??[]).filter(p=>p.thought!==true&&typeof p.text==='string').map(p=>p.text).join('').trim();
 if(text.startsWith('```')) text=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 let value;
 try {value=JSON.parse(text);}catch {throw Error('ULTIMATE_GOOGLE_AUTHORING_JSON_INVALID');}
 if(!value||typeof value!=='object'||Array.isArray(value)) throw Error('ULTIMATE_GOOGLE_AUTHORING_JSON_INVALID');
 return value;
}

/** Gemini 3 uses thinking levels; sampling overrides are unsupported. */
export function vertexLessonGenerationConfig(model,maxOutputTokens=16384) {
 return {maxOutputTokens,responseMimeType:'application/json',
  ...(/^gemini-3[.-]/.test(model)?{thinkingConfig:{thinkingLevel:'MEDIUM'}}:{temperature:0.2})};
}
