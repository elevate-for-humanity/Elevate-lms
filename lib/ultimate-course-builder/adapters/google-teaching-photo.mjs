export async function generateTeachingPhoto(prompt,{request=fetch,env=process.env}={}){
 const project=env.GOOGLE_CLOUD_PROJECT??env.GCP_PROJECT_ID??'elegant-racer-299721';
 const region=env.ULTIMATE_PHOTO_REGION??'us-central1';
 const model=env.ULTIMATE_PHOTO_MODEL??'imagen-4.0-fast-generate-001';
 if(!/^[a-z][a-z0-9-]+$/.test(project)||!/^us-(central1|east1)$/.test(region)||!/^imagen-4\.0-(fast-)?generate-001$/.test(model))
  throw Error('GOOGLE_TEACHING_PHOTO_CONFIGURATION_INVALID');
 const identity=await request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(10000)});
 if(!identity.ok)throw Error('GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE');
 const token=await identity.json();
 if(!token.access_token)throw Error('GOOGLE_TEACHING_PHOTO_IDENTITY_UNAVAILABLE');
 const response=await request('https://'+region+'-aiplatform.googleapis.com/v1/projects/'+project+'/locations/'+region+'/publishers/google/models/'+model+':predict',{
  method:'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},
  body:JSON.stringify({instances:[{prompt}],parameters:{sampleCount:1,aspectRatio:'16:9',personGeneration:'allow_adult',outputOptions:{mimeType:'image/png'}}}),
  signal:AbortSignal.timeout(180000),
 });
 if(!response.ok)throw Error('GOOGLE_TEACHING_PHOTO_HTTP_'+response.status);
 const result=await response.json();
 const prediction=result.predictions?.[0];
 if(!prediction?.bytesBase64Encoded||prediction.mimeType!=='image/png')throw Error('GOOGLE_TEACHING_PHOTO_MISSING_OR_FILTERED');
 return {bytes:Buffer.from(prediction.bytesBase64Encoded,'base64'),provider:'google',model};
}
