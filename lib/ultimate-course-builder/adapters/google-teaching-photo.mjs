export async function generateTeachingPhoto(prompt,{request=fetch,env=process.env,delay=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 const project=env.GOOGLE_CLOUD_PROJECT??env.GCP_PROJECT_ID??'elegant-racer-299721';
 const region=env.ULTIMATE_PHOTO_REGION??'us';
 const model=env.ULTIMATE_PHOTO_MODEL??'gemini-3.1-flash-image';
 if(!/^[a-z][a-z0-9-]+$/.test(project)||!['us','global'].includes(region)||model!=='gemini-3.1-flash-image')
  throw Error('GOOGLE_TEACHING_PHOTO_CONFIGURATION_INVALID');
 const identity=await request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(10000)});
 if(!identity.ok)throw Error('GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE');
 const token=await identity.json();
 if(!token.access_token)throw Error('GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE');
 const host=region==='global'?'aiplatform.googleapis.com':'aiplatform.us.rep.googleapis.com';
 for(let attempt=0;attempt<3;attempt++){
  const response=await request('https://'+host+'/v1/projects/'+project+'/locations/'+region+'/publishers/google/models/'+model+':generateContent',{
   method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseModalities:['TEXT','IMAGE'],imageConfig:{aspectRatio:'16:9',imageSize:'1K'}}}),
   signal:AbortSignal.timeout(180000),
  });
  if([429,500,502,503,504].includes(response.status)&&attempt<2){await delay(5000*2**attempt);continue;}
  if(!response.ok){const failure=await response.json().catch(()=>({}));throw Error('GOOGLE_TEACHING_PHOTO_HTTP_'+response.status+':'+String(failure.error?.message??'').slice(0,500));}
  const result=await response.json();
  const image=result.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.mimeType==='image/png')?.inlineData;
  if(!image?.data)throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');
  return {bytes:Buffer.from(image.data,'base64'),provider:'google',model};
 }
 throw Error('GOOGLE_TEACHING_PHOTO_RETRY_EXHAUSTED');
}
