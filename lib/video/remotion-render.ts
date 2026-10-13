import {createCheckpointFallback,privateCheckpointStorage} from './checkpoint-fallback.mjs';
undefine        if(!checkpoints)checkpoints=createCheckpointFallback({
          readPrimary:async(key:string)=>{
            if(!storage||!bucket)return privateStorage.read(key);
            try {const object=await storage.send(new GetObjectCommand({Bucket:bucket,Key:key}));return object.Body?Buffer.from(await object.Body.transformToByteArray()):null;}
            catch(error){if(['NoSuchKey','NotFound'].includes((error as any).name))return null;throw error;}
          },
          writePrimary:async(key:string,bytes:Buffer)=>{
            if(!storage||!bucket)return privateStorage.write(key,bytes);
            await storage.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:'video/mp4'}));
          },
          readFallback:(key:string)=>privateStorage.read(key),
          writeFallback:(key:string,bytes:Buffer)=>privateStorage.write(key,bytes),
          onFallback:()=>logger.warn('[RemotionRender] storage cap: switched to private Supabase checkpoints'),
        });
        let existing = await stat(chunkPath).catch(() => null);
        if(!existing?.size){
          const bytes=await checkpoints.read(segmentKey);
          if(bytes?.length){await writeFile(chunkPath,bytes);existing=await stat(chunkPath);}
        }
d