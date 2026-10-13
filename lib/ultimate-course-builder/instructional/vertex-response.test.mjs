import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVertexLessonResponse} from './vertex-response.mjs';
const response=(parts,finishReason='STOP')=>({candidates:[{finishReason,content:{parts}}]});
test('separates thought text from split structured answer',()=>assert.deepEqual(parseVertexLessonResponse(response([{text:'not json',thought:true},{text:'{"pass":'},{text:'true}'}])),{pass:true}));
test('accepts a complete JSON fence without extracting arbitrary fragments',()=>assert.deepEqual(parseVertexLessonResponse(response([{text:'```json\n{"pass":true}\n```'}])),{pass:true}));
test('rejects incomplete, malformed, primitive and appended answers',()=>{
 for(const text of ['{"pass":','false','{} trailing'])assert.throws(()=>parseVertexLessonResponse(response([{text}])),/JSON_INVALID/);
 assert.throws(()=>parseVertexLessonResponse(response([{text:'{}'}],'MAX_TOKENS')),/INCOMPLETE/);
});
