/** Read explicit identities only from successful execution receipts, never prompt text. */
function identity(value,keys,depth=0) {
 if(depth>5||value==null)return null;
 if(typeof value==='string'){try{return identity(JSON.parse(value),keys,depth+1);}catch{return null;}}
 if(typeof value!=='object'||Array.isArray(value))return null;
 if(value.ok===false||value.success===false||['failed','blocked','rejected'].includes(value.status))return null;
 for(const key of keys){const id=value[key];if(typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))return id;}
 for(const key of ['output','result','data','body','payload','tool_output']){const found=identity(value[key],keys,depth+1);if(found)return found;}
 return null;
}
export const courseResultId=value=>identity(value,['courseId','course_id']);
export const courseResultLessonId=value=>identity(value,['lessonId','lesson_id']);
