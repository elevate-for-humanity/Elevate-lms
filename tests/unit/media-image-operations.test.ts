import {expect,it,vi,afterEach} from 'vitest';
import sharp from 'sharp';
const ai = vi.hoisted(() => ({edit:vi.fn(),describe:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/ai/ai-service',()=>({aiEditImage:ai.edit,aiDescribeImage:ai.describe}));
import {editImageBytes,optimizeImageBytes,describeImageBytes,readImageBytes} from '@/lib/media/image-operations';
const dataUrl = (b:Buffer) => 'data:image/png;base64,'+b.toString('base64');
const bytes = (url:string) => Buffer.from(url.split(',')[1], 'base64');
afterEach(()=>vi.unstubAllGlobals());
it('crops, scales and optimizes actual image bytes to requested dimensions',async()=>{
 const source=dataUrl(await sharp({create:{width:12,height:8,channels:4,background:'red'}}).png().toBuffer());
 const crop=await editImageBytes(source,{action:'crop',cropArea:{x:0,y:0,width:6,height:4}});
 expect(await sharp(bytes(crop)).metadata()).toMatchObject({width:6,height:4,format:'png'});
 const scaled=await editImageBytes(source,{action:'upscale',scale:2});
 expect(await sharp(bytes(scaled)).metadata()).toMatchObject({width:24,height:16});
 const optimized=await optimizeImageBytes(source,{width:6,format:'webp'});
 expect(await sharp(bytes(optimized)).metadata()).toMatchObject({width:6,height:4,format:'webp'});
});
it('sends normalized source pixels to the edit and vision providers',async()=>{
 const source=dataUrl(await sharp({create:{width:4,height:4,channels:4,background:'blue'}}).png().toBuffer());
 const actual=await sharp({create:{width:4,height:4,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
 ai.edit.mockResolvedValueOnce([{b64Json:actual.toString('base64')}]);
 expect(await editImageBytes(source,{action:'remove_background'})).toBe(dataUrl(actual));
 expect(ai.edit).toHaveBeenCalledWith(expect.objectContaining({bytes:expect.any(Buffer),transparent:true}));
 ai.describe.mockResolvedValueOnce('A blue square.');
 expect(await describeImageBytes(source)).toBe('A blue square.');
 expect(ai.describe.mock.calls[0][0]).toMatch(/^data:image\/png;base64,/);
});
it('blocks arbitrary origins and invalid transform parameters before external requests',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 await expect(readImageBytes('http://127.0.0.1/private')).rejects.toThrow('IMAGE_SOURCE_NOT_ALLOWED');
 await expect(readImageBytes('https://unapproved.example/image.png')).rejects.toThrow('IMAGE_SOURCE_NOT_ALLOWED');
 await expect(optimizeImageBytes('data:image/png;base64,AAAA',{width:-1})).rejects.toThrow('IMAGE_DIMENSION_INVALID');
 expect(fetcher).not.toHaveBeenCalled();
});
it('propagates genuine provider failures instead of returning the original image',async()=>{
 const source=dataUrl(await sharp({create:{width:2,height:2,channels:4,background:'red'}}).png().toBuffer());
 ai.edit.mockRejectedValueOnce(new Error('edit failed'));
 await expect(editImageBytes(source,{action:'remove_background'})).rejects.toThrow('edit failed');
});
